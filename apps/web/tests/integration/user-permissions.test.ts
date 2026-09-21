import { Client } from "pg";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { accessPermissionSchema, type AccessPermission } from "@caab/contracts";
import { readUserAccess } from "@caab/db/repositories/user-access";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { loadActiveSession } from "../../modules/auth/session-dal";
import { loadCurrentUser } from "../../modules/auth/current-user";
import { changeUserAccess } from "../../modules/users/user-access-service";
import { authorizeMemberAccess } from "../../modules/members/access";
let container: StartedPostgreSqlContainer,
  admin: Client,
  db: ReturnType<typeof createDatabaseClient>;
const all = [...accessPermissionSchema.options];
let manager: { id: string; token: string }, target: { id: string; token: string };
async function user(name: string, permissions?: string[]) {
  const id = (
    await admin.query('INSERT INTO "user"(name,email) VALUES ($1,$2) RETURNING id', [
      name,
      `${name}@example.test`,
    ])
  ).rows[0].id as string;
  const token = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,now()+interval '1 hour')",
    [token, id],
  );
  if (permissions)
    await admin.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES ($1,$2,$1)", [
      id,
      permissions,
    ]);
  return { id, token };
}
async function command(permissions: AccessPermission[], targetId = target.id) {
  const snapshot = await readUserAccess(db.pool, targetId);
  return {
    actor: (await loadActiveSession(db.pool, manager.token))!,
    targetUserId: targetId,
    input: {
      version: snapshot.version,
      expectedPermissions: snapshot.permissions,
      permissions,
      justification: "Ajuste sintético autorizado",
    },
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
}
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  db = createDatabaseClient(url.toString());
}, 120000);
afterAll(async () => {
  await db?.close();
  await admin?.end();
  await container?.stop();
});
beforeEach(async () => {
  await admin.query('TRUNCATE "user" CASCADE');
  manager = await user("manager");
  await admin.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification) SELECT $1,id,$1,'Synthetic manager' FROM role WHERE code='manager'",
    [manager.id],
  );
  target = await user("target");
});
describe("individual permissions in PostgreSQL", () => {
  it("starts without implicit access, then makes selection effective in session, identity and member service", async () => {
    expect((await readUserAccess(db.pool, target.id)).permissions).toEqual([]);
    await changeUserAccess(db.pool, await command(["members:read"]));
    const actor = (await loadActiveSession(db.pool, target.token))!;
    expect([...actor.permissions]).toEqual(["members:read"]);
    expect((await loadCurrentUser(db.pool, target.id))!.permissions).toEqual(["members:read"]);
    const client = await db.pool.connect();
    try {
      expect(await authorizeMemberAccess(client, actor)).toEqual(new Set(["members:read"]));
    } finally {
      client.release();
    }
    const audit = await admin.query(
      "SELECT before,after FROM audit_event WHERE action='user.access.updated'",
    );
    expect(audit.rows).toHaveLength(1);
    await changeUserAccess(db.pool, await command([]));
    const revoked = await db.pool.connect();
    try {
      await expect(authorizeMemberAccess(revoked, actor)).rejects.toMatchObject({ status: 403 });
    } finally {
      revoked.release();
    }
  });
  it("rejects self changes and authority injected in a stale actor", async () => {
    await expect(changeUserAccess(db.pool, await command([], manager.id))).rejects.toMatchObject({
      code: "SELF_ESCALATION_DENIED",
    });
    const update = await command(["members:read"]);
    await admin.query("UPDATE user_role SET revoked_at=now() WHERE user_id=$1", [manager.id]);
    await expect(changeUserAccess(db.pool, update)).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
  });
  it("rejects revoked sessions even with a previously resolved actor", async () => {
    const update = await command([]);
    await admin.query("UPDATE session SET revoked_at=now() WHERE user_id=$1", [manager.id]);
    await expect(changeUserAccess(db.pool, update)).rejects.toMatchObject({ status: 401 });
  });
  it("saves only one competing edit and rejects the stale snapshot", async () => {
    const update = await command(["members:read"]);
    const results = await Promise.allSettled([
      changeUserAccess(db.pool, update),
      changeUserAccess(db.pool, { ...update, input: { ...update.input, permissions: [] } }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected")).toMatchObject({
      reason: { code: "ACCESS_VERSION_CONFLICT" },
    });
  });
  it("rolls back the selection if its audit cannot be written", async () => {
    await expect(
      changeUserAccess(db.pool, await command([]), async () => {
        throw new Error("synthetic audit failure");
      }),
    ).rejects.toThrow("synthetic audit failure");
    expect((await readUserAccess(db.pool, target.id)).version).toBe(0);
  });
  it("prevents a manager from removing the administrator role base through individual permissions", async () => {
    const role = (
      await admin.query(
        "INSERT INTO role(code,name,description,is_administrative) VALUES ('administrator','Last admin','Synthetic',true) ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name RETURNING id",
      )
    ).rows[0].id;
    await admin.query(
      "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES ($1,$2,$1,'Synthetic')",
      [target.id, role],
    );
    await admin.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES ($1,$2,$1)", [
      target.id,
      all,
    ]);
    await expect(changeUserAccess(db.pool, await command([]))).rejects.toMatchObject({
      code: "ROLE_GRANT_DENIED",
    });
  });
});

it("lets a manager grant writes they cannot use but never grants delegation to a collaborator", async () => {
  const actor = (await loadActiveSession(db.pool, manager.token))!;
  expect(actor.permissions.has("members:write")).toBe(false);
  await changeUserAccess(db.pool, await command(["members:read", "members:write"]));
  expect((await readUserAccess(db.pool, target.id)).permissions).toEqual([
    "members:read",
    "members:write",
  ]);
  await expect(
    changeUserAccess(db.pool, await command(["users:read", "roles:read", "roles:grant"])),
  ).rejects.toMatchObject({ code: "ROLE_GRANT_DENIED" });
  await admin.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,$2,$1)", [
    manager.id,
    all,
  ]);
  await admin.query("UPDATE user_role SET revoked_at=now() WHERE user_id=$1", [manager.id]);
  await expect(changeUserAccess(db.pool, await command([]))).rejects.toMatchObject({ status: 403 });
});

it("administrator keeps every current capability even when individual overrides are empty", async () => {
  await admin.query(
    "INSERT INTO role(code,name,is_administrative) VALUES ('administrator','Administrador',true) ON CONFLICT(code) DO NOTHING",
  );
  await admin.query("UPDATE user_role SET revoked_at=now() WHERE user_id=$1", [manager.id]);
  await admin.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification) SELECT $1,id,$1,'Synthetic administrator' FROM role WHERE code='administrator'",
    [manager.id],
  );
  await changeUserAccess(db.pool, await command([], manager.id));
  const effective = (await readUserAccess(db.pool, manager.id)).permissions;
  for (const permission of all) expect(effective).toContain(permission);
  expect(
    (await admin.query("SELECT permissions FROM user_access WHERE user_id=$1", [manager.id]))
      .rows[0].permissions,
  ).toEqual([]);
});
