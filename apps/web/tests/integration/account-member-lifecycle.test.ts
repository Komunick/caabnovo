import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { readUserPermissions } from "@caab/db/repositories/user-access";
import { listUsers } from "@caab/db/repositories/users";
import { createUser, changeUser, changeUserLifecycle } from "../../modules/users/user-service";
import { resetUserPassword } from "../../modules/users/initial-password-service";
import { createMember, commandMember, listMembers } from "../../modules/members/member-service";
import { verifyPassword } from "better-auth/crypto";
import type { RequestActor } from "../../modules/shared/request-context";

let container: StartedPostgreSqlContainer, admin: Client;
let database: ReturnType<typeof createDatabaseClient>, actor: RequestActor;
const context = () => ({
  actor,
  effectiveIdentity: `user:${actor.userId}`,
  requestId: crypto.randomUUID(),
  correlationId: crypto.randomUUID(),
  idempotencyKey: crypto.randomUUID(),
});
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  database = createDatabaseClient(url.toString());
}, 120_000);
afterAll(async () => {
  await database?.close();
  await admin?.end();
  await container?.stop();
});
beforeEach(async () => {
  await admin.query('TRUNCATE "user",member,idempotency_record CASCADE');
  const userId = crypto.randomUUID(),
    sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO \"user\"(id,name,email) VALUES ($1,'Synthetic administrator','lifecycle-admin@example.test')",
    [userId],
  );
  await admin.query(
    "INSERT INTO role(code,name,is_administrative) VALUES ('administrator','Administrador',true) ON CONFLICT(code) DO NOTHING",
  );
  await admin.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_from) SELECT $1,id,$1,'Synthetic test',now() FROM role WHERE code='administrator'",
    [userId],
  );
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
  actor = {
    userId,
    sessionId,
    permissions: new Set(await readUserPermissions(database.pool, userId)),
  };
});
const colleague = () =>
  createUser(database.pool, {
    ...context(),
    name: "Lifecycle colleague",
    email: "lifecycle@example.test",
    roleIds: [],
  });
describe("account and member lifecycle", () => {
  it("blocks the colleague now, hides after 24 hours, preserves identity, and explicitly restores", async () => {
    const user = await colleague();
    const sessionId = crypto.randomUUID();
    await admin.query(
      "INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,now()+interval '2 days')",
      [sessionId, user.id],
    );
    const deleted = await changeUserLifecycle(database.pool, {
      ...context(),
      userId: user.id,
      version: user.version,
      action: "delete",
    });
    expect(deleted.status).toBe("disabled");
    expect(Date.parse(deleted.deletionEffectiveAt!) - Date.now()).toBeGreaterThan(23.99 * 3600000);
    expect(Date.parse(deleted.deletionEffectiveAt!) - Date.now()).toBeLessThanOrEqual(24 * 3600000);
    expect(
      (await admin.query("SELECT revoked_at FROM session WHERE id=$1", [sessionId])).rows[0]
        .revoked_at,
    ).not.toBeNull();
    expect((await listUsers(database.pool, { limit: 100 })).items.map((u) => u.id)).toContain(
      user.id,
    );
    await expect(
      changeUser(database.pool, {
        ...context(),
        userId: user.id,
        version: deleted.version,
        status: "active",
        justification: "",
      }),
    ).rejects.toMatchObject({ code: "USER_DELETION_PENDING" });
    await admin.query(
      "UPDATE \"user\" SET deletion_effective_at=clock_timestamp()-interval '1 second' WHERE id=$1",
      [user.id],
    );
    expect((await listUsers(database.pool, { limit: 100 })).items.map((u) => u.id)).not.toContain(
      user.id,
    );
    expect(
      (await listUsers(database.pool, { limit: 100, deleted: "only" })).items.map((u) => u.id),
    ).toContain(user.id);
    const restored = await changeUserLifecycle(database.pool, {
      ...context(),
      userId: user.id,
      version: deleted.version,
      action: "restore",
    });
    expect(restored.status).toBe("active");
    expect(restored.deletionEffectiveAt).toBeNull();
    expect(
      (await admin.query("SELECT revoked_at FROM session WHERE id=$1", [sessionId])).rows[0]
        .revoked_at,
    ).not.toBeNull();
    await expect(
      changeUserLifecycle(database.pool, {
        ...context(),
        userId: actor.userId,
        version: 1,
        action: "delete",
      }),
    ).rejects.toMatchObject({ code: "LAST_ADMINISTRATOR" });
  });
  it("replaces a password once per version and rolls back on audit failure without leaking secrets", async () => {
    const user = await colleague();
    const command = { ...context(), userId: user.id, version: user.version };
    const results = await Promise.allSettled([
      resetUserPassword(database.pool, command),
      resetUserPassword(database.pool, command),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({
      reason: { code: "USER_VERSION_CONFLICT" },
    });
    const success = results.find((r) => r.status === "fulfilled")!;
    if (success.status !== "fulfilled") throw new Error("Missing result");
    const hash = (await admin.query("SELECT password FROM account WHERE user_id=$1", [user.id]))
      .rows[0].password;
    expect(await verifyPassword({ hash, password: success.value.initialPassword })).toBe(true);
    expect(await verifyPassword({ hash, password: user.initialPassword! })).toBe(false);
    await expect(
      resetUserPassword(database.pool, { ...command, version: success.value.version }, async () => {
        throw new Error("audit failure");
      }),
    ).rejects.toThrow("audit failure");
    expect(
      (await admin.query("SELECT password FROM account WHERE user_id=$1", [user.id])).rows[0]
        .password === hash,
    ).toBe(true);
    const stored = JSON.stringify((await admin.query("SELECT * FROM audit_event")).rows);
    expect(stored.includes(success.value.initialPassword) || stored.includes(hash)).toBe(false);
    await admin.query("UPDATE session SET revoked_at=now() WHERE id=$1", [actor.sessionId]);
    await expect(
      resetUserPassword(database.pool, { ...command, version: success.value.version }),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("preserves members for seven days, permits undo, and never archives or removes relationships implicitly", async () => {
    const member = await createMember(database.pool, context(), {
      profile: { name: "Lifecycle member" },
    });
    const scheduled = await commandMember(database.pool, context(), member.id, {
      action: "delete",
      expectedVersion: member.version,
    });
    expect(Date.parse(scheduled.deletionEffectiveAt!) - Date.now()).toBeGreaterThan(
      6.99 * 86400000,
    );
    expect(scheduled.archivedAt).toBeNull();
    expect((await listMembers(database.pool, actor, {})).items.map((m) => m.id)).toContain(
      member.id,
    );
    const restored = await commandMember(database.pool, context(), member.id, {
      action: "restore-deleted",
      expectedVersion: scheduled.version,
    });
    expect(restored.deletionEffectiveAt).toBeNull();
    const again = await commandMember(database.pool, context(), member.id, {
      action: "delete",
      expectedVersion: restored.version,
    });
    await admin.query(
      "UPDATE member SET deletion_effective_at=clock_timestamp()-interval '1 second' WHERE id=$1",
      [member.id],
    );
    expect((await listMembers(database.pool, actor, {})).items.map((m) => m.id)).not.toContain(
      member.id,
    );
    expect(
      (await listMembers(database.pool, actor, { deleted: "only" })).items.map((m) => m.id),
    ).toContain(member.id);
    await expect(
      commandMember(database.pool, context(), member.id, {
        action: "activate",
        expectedVersion: again.version,
      }),
    ).rejects.toMatchObject({ code: "MEMBER_DELETED" });
    expect((await admin.query("SELECT id FROM member WHERE id=$1", [member.id])).rowCount).toBe(1);
  });
});

it("allows only administrators and managers to reset another collaborator and protects administrator credentials", async () => {
  const user = await colleague();
  const managerId = crypto.randomUUID(),
    sessionId = crypto.randomUUID();
  await admin.query(
    `INSERT INTO "user"(id,name,email) VALUES($1,'Manager','reset-manager@example.test')`,
    [managerId],
  );
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, managerId],
  );
  await admin.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification) SELECT $1,id,$1,'Synthetic manager' FROM role WHERE code='manager'",
    [managerId],
  );
  const manager = {
    userId: managerId,
    sessionId,
    permissions: new Set(await readUserPermissions(database.pool, managerId)),
  };
  expect(manager.permissions.has("users:update")).toBe(false);
  const reset = await resetUserPassword(database.pool, {
    ...context(),
    actor: manager,
    userId: user.id,
    version: user.version,
  });
  expect(reset.version).toBe(user.version + 1);
  await expect(
    resetUserPassword(database.pool, {
      ...context(),
      actor: manager,
      userId: actor.userId,
      version: 1,
    }),
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    resetUserPassword(database.pool, {
      ...context(),
      actor: manager,
      userId: managerId,
      version: 1,
    }),
  ).rejects.toMatchObject({ status: 403 });
  await admin.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['users:read','users:reset-password'],$1)",
    [managerId],
  );
  await admin.query("UPDATE user_role SET revoked_at=now() WHERE user_id=$1", [managerId]);
  await expect(
    resetUserPassword(database.pool, {
      ...context(),
      actor: manager,
      userId: user.id,
      version: reset.version,
    }),
  ).rejects.toMatchObject({ status: 403 });
});
