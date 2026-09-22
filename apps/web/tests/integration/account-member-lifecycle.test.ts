import { syntheticUserContact } from "../helpers/user-contact";
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { readUserPermissions } from "@caab/db/repositories/user-access";
import { listUsers } from "@caab/db/repositories/users";
import {
  createUser,
  changeUser,
  changeUserLifecycle,
  lookupUserCpf,
} from "../../modules/users/user-service";
import { findUserById } from "@caab/db/repositories/users";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { resetUserPassword } from "../../modules/users/initial-password-service";
import {
  createMember,
  commandMember,
  listMembers,
  getMember,
} from "../../modules/members/member-service";
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
    "INSERT INTO role(code,name,description,is_administrative) VALUES ('administrator','Administrador','Synthetic administrator',true) ON CONFLICT(code) DO NOTHING",
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
    ...syntheticUserContact(),
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
      reason: "Encerramento sintético",
    });
    expect(deleted.status).toBe("disabled");
    expect(deleted.deletionReason).toBe("Encerramento sintético");
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
        reason: "Encerramento sintético",
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
    for (const justification of ["", "   "]) {
      await expect(
        commandMember(database.pool, context(), member.id, {
          action: "delete",
          justification,
          expectedVersion: member.version,
        }),
      ).rejects.toThrow();
    }
    expect((await getMember(database.pool, actor, member.id)).version).toBe(member.version);
    const scheduled = await commandMember(database.pool, context(), member.id, {
      action: "delete",
      justification: "Encerramento sintético",
      expectedVersion: member.version,
    });
    expect(Date.parse(scheduled.deletionEffectiveAt!) - Date.now()).toBeGreaterThan(
      6.99 * 86400000,
    );
    expect(scheduled.archivedAt).toBeNull();
    expect(scheduled.deletionReason).toBe("Encerramento sintético");
    expect((await listMembers(database.pool, actor, {})).items.map((m) => m.id)).toContain(
      member.id,
    );
    const restored = await commandMember(database.pool, context(), member.id, {
      action: "restore-deleted",
      expectedVersion: scheduled.version,
    });
    expect(restored.deletionEffectiveAt).toBeNull();
    expect(restored.deletionReason).toBeNull();
    const again = await commandMember(database.pool, context(), member.id, {
      action: "delete",
      justification: "Segunda solicitação sintética",
      expectedVersion: restored.version,
    });
    expect(again.deletionReason).toBe("Segunda solicitação sintética");
    const history = await admin.query(
      "SELECT reason,actor_user_id,occurred_at FROM audit_event WHERE entity_type='member' AND entity_id=$1 AND action='member.delete' ORDER BY occurred_at",
      [member.id],
    );
    expect(history.rows.map((row) => row.reason)).toEqual([
      "Encerramento sintético",
      "Segunda solicitação sintética",
    ]);
    expect(history.rows.every((row) => row.actor_user_id === actor.userId && row.occurred_at)).toBe(
      true,
    );
    await admin.query(
      "UPDATE member SET deletion_effective_at=clock_timestamp()-interval '1 second' WHERE id=$1",
      [member.id],
    );
    // The synthetic effective date has no matching audit occurrence: do not reuse an older reason.
    expect((await getMember(database.pool, actor, member.id)).deletionReason).toBeNull();
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
  await admin.query("UPDATE user_role SET revoked_at=now(),revoked_by=user_id WHERE user_id=$1", [
    managerId,
  ]);
  await expect(
    resetUserPassword(database.pool, {
      ...context(),
      actor: manager,
      userId: user.id,
      version: reset.version,
    }),
  ).rejects.toMatchObject({ status: 403 });
});

it("keeps CPF reserved, returns the correct deletion occurrence and restores without overwriting profile", async () => {
  const user = await colleague();
  expect(await lookupUserCpf(database.pool, actor, { cpf: user.cpf })).toEqual({
    status: "existing",
  });
  expect(await lookupUserCpf(database.pool, actor, { cpf: syntheticUserContact().cpf })).toEqual({
    status: "available",
  });
  for (const reason of ["", "   "]) {
    await expect(
      changeUserLifecycle(database.pool, {
        ...context(),
        userId: user.id,
        version: 1,
        action: "delete",
        reason,
      }),
    ).rejects.toThrow();
  }
  expect((await findUserById(database.pool, user.id))?.version).toBe(1);
  const first = await changeUserLifecycle(database.pool, {
    ...context(),
    userId: user.id,
    version: 1,
    action: "delete",
    reason: "First occurrence",
  });
  await changeUserLifecycle(database.pool, {
    ...context(),
    userId: user.id,
    version: first.version,
    action: "restore",
  });
  // A distinct historical occurrence is seeded with a past effective date in this disposable DB.
  const expired = await admin.query<{ deletion_effective_at: Date; version: number }>(
    `UPDATE "user" SET status='disabled', deactivated_at=now(), deletion_effective_at=date_trunc('milliseconds',clock_timestamp()-interval '1 second'),version=version+1 WHERE id=$1 RETURNING deletion_effective_at,version`,
    [user.id],
  );
  await writeAuditEvent(admin, {
    actorUserId: actor.userId,
    effectiveIdentity: actor.userId,
    action: "user.deletion.requested",
    entityType: "user",
    entityId: user.id,
    reason: "Current occurrence",
    after: { deletionEffectiveAt: expired.rows[0]!.deletion_effective_at.toISOString() },
    origin: "web",
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  });
  const found = await lookupUserCpf(database.pool, actor, { cpf: user.cpf });
  expect(found).toEqual({
    status: "deleted",
    id: user.id,
    version: expired.rows[0]!.version,
    reason: "Current occurrence",
    canRestore: true,
  });
  await expect(
    createUser(database.pool, {
      ...context(),
      ...syntheticUserContact(),
      cpf: user.cpf!,
      name: "Replacement data",
      email: "replacement@example.test",
      roleIds: [],
    }),
  ).rejects.toMatchObject({ code: "USER_CPF_CONFLICT" });
  await expect(
    changeUserLifecycle(database.pool, {
      ...context(),
      userId: user.id,
      version: 1,
      action: "restore",
    }),
  ).rejects.toMatchObject({ code: "USER_VERSION_CONFLICT" });
  const restore = {
    ...context(),
    userId: user.id,
    version: expired.rows[0]!.version,
    action: "restore" as const,
  };
  const attempts = await Promise.allSettled([
    changeUserLifecycle(database.pool, restore),
    changeUserLifecycle(database.pool, restore),
  ]);
  expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  expect(await findUserById(database.pool, user.id)).toMatchObject({
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    phone: user.phone,
    address: user.address,
    status: "active",
    deletionEffectiveAt: null,
  });
  const history = await admin.query(
    "SELECT reason,actor_user_id,occurred_at FROM audit_event WHERE entity_id=$1 AND action='user.deletion.requested' ORDER BY occurred_at",
    [user.id],
  );
  expect(history.rows.map((row) => row.reason)).toEqual(["First occurrence", "Current occurrence"]);
  expect(history.rows.every((row) => row.actor_user_id === actor.userId && row.occurred_at)).toBe(
    true,
  );
  await admin.query(
    `UPDATE "user" SET status='disabled',deactivated_at=now(),deletion_effective_at=clock_timestamp()-interval '2 seconds' WHERE id=$1`,
    [user.id],
  );
  expect(await lookupUserCpf(database.pool, actor, { cpf: user.cpf })).toMatchObject({
    status: "deleted",
    reason: null,
  });
  await admin.query("UPDATE session SET revoked_at=now() WHERE id=$1", [actor.sessionId]);
  await expect(lookupUserCpf(database.pool, actor, { cpf: user.cpf })).rejects.toMatchObject({
    status: 401,
  });
});

it("combines dates, role, status, pending deletion and pagination filters", async () => {
  const user = await colleague();
  const second = await createUser(database.pool, {
    ...context(),
    ...syntheticUserContact(),
    name: "Lifecycle second",
    email: "second@example.test",
    roleIds: [],
  });
  await admin.query(`UPDATE "user" SET created_at='2026-09-02T02:59:59Z' WHERE id=$1`, [user.id]);
  await admin.query(`UPDATE "user" SET created_at='2026-09-02T03:00:00Z' WHERE id=$1`, [second.id]);
  const query = {
    q: "Lifecycle",
    roleId: "none",
    createdFrom: "2026-09-01",
    createdTo: "2026-09-01",
    limit: 1,
  };
  expect((await listUsers(database.pool, query)).items.map((item) => item.id)).toEqual([user.id]);
  const role = await admin.query<{ id: string }>("SELECT id FROM role WHERE code='administrator'");
  expect(
    (await listUsers(database.pool, { roleId: role.rows[0]!.id, limit: 100 })).items.map(
      (item) => item.id,
    ),
  ).toEqual([actor.userId]);
  await changeUserLifecycle(database.pool, {
    ...context(),
    userId: user.id,
    version: user.version,
    action: "delete",
    reason: "Filtered occurrence",
  });
  expect(
    (
      await listUsers(database.pool, { ...query, status: "disabled", deleted: "pending" })
    ).items.map((item) => item.id),
  ).toEqual([user.id]);
  expect(
    (await listUsers(database.pool, { ...query, status: "active", deleted: "pending" })).items,
  ).toEqual([]);
  const all = await listUsers(database.pool, { q: "Lifecycle", roleId: "none", limit: 1 });
  expect(all.nextCursor).not.toBeNull();
  expect(
    (
      await listUsers(database.pool, {
        q: "Lifecycle",
        roleId: "none",
        cursor: all.nextCursor!,
        limit: 1,
      })
    ).items[0]!.id,
  ).not.toBe(all.items[0]!.id);
});
