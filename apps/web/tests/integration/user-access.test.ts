import { syntheticUserContact } from "../helpers/user-contact";
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { grantRole, revokeRole, promoteRole } from "../../modules/users/role-assignment-service";
import { createUser, changeUser } from "../../modules/users/user-service";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";

let container: StartedPostgreSqlContainer;
let admin: Client;
let database: ReturnType<typeof createDatabaseClient>;

const managerPermissions = new Set([
  "roles:grant",
  "roles:revoke",
  "users:read",
  "users:create",
  "users:update",
  "users:disable",
]);

async function seedUser(email: string, twoFactorEnabled = false) {
  const result = await admin.query<{ id: string }>(
    `INSERT INTO "user" (email, name, email_verified, two_factor_enabled)
     VALUES ($1, $2, true, $3) RETURNING id`,
    [email, email, twoFactorEnabled],
  );
  const id = result.rows[0]!.id;
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1::text,$1::text,$1::uuid,now()+interval '1 hour')",
    [id],
  );
  if (email === "manager@example.test") {
    const roleId = await seedRole("administrator", true);
    await admin.query(
      "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES($1,$2,$1,'Synthetic administrator')",
      [id, roleId],
    );
  }
  return id;
}

async function seedRole(code: string, administrative = false) {
  const result = await admin.query<{ id: string }>(
    `INSERT INTO role (code, name, description, is_administrative)
     VALUES ($1, $1, $1, $2) ON CONFLICT(code) DO UPDATE SET is_administrative=EXCLUDED.is_administrative RETURNING id`,
    [code, administrative],
  );
  const permissions = [...managerPermissions];
  for (const permission of permissions) {
    const [resource, action] = permission.split(":");
    const inserted = await admin.query<{ id: string }>(
      `INSERT INTO permission (resource, action, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (resource, action) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      [resource, action, permission],
    );
    await admin.query(
      `INSERT INTO role_permission (role_id, permission_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [result.rows[0]!.id, inserted.rows[0]!.id],
    );
  }
  return result.rows[0]!.id;
}

function context(actorId: string) {
  return {
    actor: {
      userId: actorId,
      sessionId: actorId,
      permissions: managerPermissions,
      mfaVerified: true,
    },
    effectiveIdentity: `user:${actorId}`,
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
}

beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  database = createDatabaseClient(container.getConnectionUri());
}, 120_000);

afterAll(async () => {
  await database?.close();
  await admin?.end();
  await container?.stop();
});

beforeEach(async () => {
  await admin.query(
    `TRUNCATE user_role, role_permission, permission, role, security_event, audit_event,
      session, account, verification, two_factor, "user" CASCADE`,
  );
});

describe.sequential("user access transactions", () => {
  it("creates and edits a collaborator without a reason while preserving audit attribution", async () => {
    const actorId = await seedUser("manager@example.test");
    const roleId = await seedRole("initial-role");
    const created = await createUser(database.pool, {
      ...context(actorId),
      ...syntheticUserContact(),
      name: "Novo colaborador",
      email: "new@example.test",
      roleIds: [roleId],
    });
    expect(created.roles).toHaveLength(1);
    const event = await admin.query(
      "SELECT reason,actor_user_id FROM audit_event WHERE entity_id=$1 AND action='user.created'",
      [created.id],
    );
    expect(event.rows[0]).toMatchObject({
      actor_user_id: actorId,
      reason: null,
    });
    await expect(
      changeUser(database.pool, {
        ...context(actorId),
        userId: created.id,
        version: 1,
        name: "Atualizado sem motivo",
        justification: "   ",
      }),
    ).resolves.toMatchObject({ name: "Atualizado sem motivo", version: 2 });
    expect(
      (await admin.query('SELECT name,version FROM "user" WHERE id=$1', [created.id])).rows[0],
    ).toEqual({ name: "Atualizado sem motivo", version: 2 });
  });
  it("grants an administrative role to an active user without an authenticator", async () => {
    const actorId = await seedUser("manager@example.test");
    const targetId = await seedUser("target@example.test");
    const roleId = await seedRole("administrator", true);
    await grantRole(database.pool, {
      ...context(actorId),
      targetUserId: targetId,
      roleId,
      justification: "Concessão administrativa autorizada",
    });
    expect(
      (
        await admin.query(
          "SELECT id FROM user_role WHERE user_id=$1 AND role_id=$2 AND revoked_at IS NULL",
          [targetId, roleId],
        )
      ).rowCount,
    ).toBe(1);
  });
  it("keeps a single active assignment when the same grant is repeated", async () => {
    const actorId = await seedUser("manager@example.test", true);
    const targetId = await seedUser("target@example.test");
    const roleId = await seedRole("user-manager");

    await grantRole(database.pool, {
      ...context(actorId),
      targetUserId: targetId,
      roleId,
      justification: "Atribuição inicial",
    });

    await expect(
      grantRole(database.pool, {
        ...context(actorId),
        targetUserId: targetId,
        roleId,
        justification: "Atribuição duplicada",
      }),
    ).rejects.toMatchObject({ code: "ROLE_ALREADY_ASSIGNED", status: 409 });

    const count = await admin.query<{ count: string }>(
      "SELECT count(*) FROM user_role WHERE user_id = $1 AND role_id = $2 AND revoked_at IS NULL",
      [targetId, roleId],
    );
    expect(count.rows[0]?.count).toBe("1");
  });

  it("serializes concurrent revocations and preserves the last administrator", async () => {
    const firstAdmin = await seedUser("admin-one@example.test", true);
    const actorId = firstAdmin;
    const secondAdmin = await seedUser("admin-two@example.test", true);
    const roleId = await seedRole("administrator", true);
    for (const targetUserId of [firstAdmin, secondAdmin]) {
      await admin.query(
        `INSERT INTO user_role (user_id, role_id, granted_by, justification)
         VALUES ($1, $2, $3, 'Bootstrap sintético')`,
        [targetUserId, roleId, actorId],
      );
    }

    const results = await Promise.allSettled(
      [firstAdmin, secondAdmin].map((targetUserId) =>
        revokeRole(database.pool, {
          ...context(targetUserId),
          targetUserId,
          roleId,
          reason: "Mudança organizacional",
        }),
      ),
    );

    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
    expect(results.find(({ status }) => status === "rejected")).toMatchObject({
      reason: { code: "LAST_ADMINISTRATOR", status: 409 },
    });
    const remaining = await admin.query<{ count: string }>(
      `SELECT count(DISTINCT ur.user_id) FROM user_role ur
       JOIN role r ON r.id = ur.role_id
       JOIN "user" u ON u.id = ur.user_id
       WHERE r.is_administrative AND ur.revoked_at IS NULL AND u.status = 'active'`,
    );
    expect(remaining.rows[0]?.count).toBe("1");
  });

  it("rolls back the assignment when its audit event cannot be written", async () => {
    const actorId = await seedUser("manager@example.test", true);
    const targetId = await seedUser("target@example.test");
    const roleId = await seedRole("user-manager");

    await expect(
      grantRole(
        database.pool,
        {
          ...context(actorId),
          targetUserId: targetId,
          roleId,
          justification: "Falha de auditoria simulada",
        },
        { writeAudit: async () => Promise.reject(new Error("audit unavailable")) },
      ),
    ).rejects.toThrow("audit unavailable");

    const assignment = await admin.query(
      "SELECT id FROM user_role WHERE user_id = $1 AND role_id = $2",
      [targetId, roleId],
    );
    expect(assignment.rows).toHaveLength(0);
  });

  it("soft-disables the account and revokes its sessions atomically", async () => {
    const actorId = await seedUser("manager@example.test", true);
    const targetId = await seedUser("target@example.test");
    const token = crypto.randomUUID();
    await admin.query(
      `INSERT INTO session (id, token, user_id, expires_at)
       VALUES ($1, $1, $2, now() + interval '1 hour')`,
      [token, targetId],
    );

    const updated = await changeUser(database.pool, {
      ...context(actorId),
      userId: targetId,
      version: 1,
      status: "disabled",
      justification: "Vínculo encerrado",
    });

    expect(updated).toMatchObject({ status: "disabled", version: 2 });
    const persisted = await admin.query<{
      status: string;
      deactivated_at: Date | null;
      revoked_at: Date | null;
    }>(
      `SELECT u.status, u.deactivated_at, s.revoked_at
       FROM "user" u JOIN session s ON s.user_id = u.id WHERE u.id = $1`,
      [targetId],
    );
    expect(persisted.rows[0]?.status).toBe("disabled");
    expect(persisted.rows[0]?.deactivated_at).toBeInstanceOf(Date);
    expect(persisted.rows[0]?.revoked_at).toBeInstanceOf(Date);
    expect(
      await admin.query("SELECT id FROM audit_event WHERE action = 'user.disabled'"),
    ).toHaveProperty("rowCount", 1);
    expect(
      await admin.query("SELECT id FROM security_event WHERE reason_code = 'ACCOUNT_DISABLED'"),
    ).toHaveProperty("rowCount", 1);
  });

  it("rolls back account disablement and session revocation when auditing fails", async () => {
    const actorId = await seedUser("manager@example.test", true);
    const targetId = await seedUser("target@example.test");
    const token = crypto.randomUUID();
    await admin.query(
      `INSERT INTO session (id, token, user_id, expires_at)
       VALUES ($1, $1, $2, now() + interval '1 hour')`,
      [token, targetId],
    );

    await expect(
      changeUser(
        database.pool,
        {
          ...context(actorId),
          userId: targetId,
          version: 1,
          status: "disabled",
          justification: "Falha simulada",
        },
        { writeAudit: async () => Promise.reject(new Error("audit unavailable")) },
      ),
    ).rejects.toThrow("audit unavailable");

    const persisted = await admin.query<{
      status: string;
      version: number;
      revoked_at: Date | null;
    }>(
      `SELECT u.status, u.version, s.revoked_at
       FROM "user" u JOIN session s ON s.user_id = u.id WHERE u.id = $1`,
      [targetId],
    );
    expect(persisted.rows[0]).toMatchObject({ status: "active", version: 1, revoked_at: null });
  });
});

describe("collaborator profile persistence", () => {
  it("persists normalized contact data, detects duplicates and version conflicts, and keeps legacy accounts", async () => {
    const actorId = await seedUser("manager@example.test");
    const contact = syntheticUserContact();
    const command = {
      ...context(actorId),
      ...contact,
      name: "Pessoa Teste",
      email: "contact@example.test",
      roleIds: [],
      idempotencyKey: crypto.randomUUID(),
    };
    const created = await createUser(database.pool, command);
    expect(created).toMatchObject(contact);
    const { findUserById, listUsers } = await import("@caab/db/repositories/users");
    expect(await findUserById(database.pool, created.id)).toMatchObject(contact);
    for (const q of [
      "Pessoa Teste",
      "contact@example.test",
      contact.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
    ]) {
      expect(
        (await listUsers(database.pool, { q, limit: 100 })).items.map((user) => user.id),
      ).toEqual([created.id]);
    }
    expect((await listUsers(database.pool, { q: "%", limit: 100 })).items).toHaveLength(0);
    expect(
      (await listUsers(database.pool, { q: "Pessoa Teste", status: "disabled", limit: 100 })).items,
    ).toHaveLength(0);

    await expect(
      createUser(database.pool, { ...command, phone: "71999990001" }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
    await expect(
      createUser(database.pool, {
        ...command,
        email: "duplicate@example.test",
        idempotencyKey: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "USER_CPF_CONFLICT" });
    await expect(
      changeUser(database.pool, {
        ...context(actorId),
        actor: { ...context(actorId).actor, permissions: new Set(["users:disable"]) },
        userId: created.id,
        version: 1,
        status: "disabled",
        phone: "71999990002",
        justification: "",
      }),
    ).rejects.toThrow();
    const legacy = await seedUser("legacy-contact@example.test");
    expect(await findUserById(database.pool, legacy)).toMatchObject({
      cpf: null,
      phone: null,
      address: null,
    });
    await expect(
      changeUser(database.pool, {
        ...context(actorId),
        userId: legacy,
        version: 1,
        cpf: contact.cpf,
        justification: "",
      }),
    ).rejects.toMatchObject({ code: "USER_CPF_CONFLICT" });
    await expect(
      changeUser(database.pool, {
        ...context(actorId),
        userId: legacy,
        version: 1,
        name: "Legado preservado",
        justification: "",
      }),
    ).resolves.toMatchObject({ version: 2, cpf: null });
    const partial = await changeUser(database.pool, {
      ...context(actorId),
      userId: legacy,
      version: 2,
      address: { street: "Rua gradativa" },
      justification: "",
    });
    expect(partial).toMatchObject({
      version: 3,
      cpf: null,
      phone: null,
      address: { street: "Rua gradativa", city: "", postalCode: "" },
    });
    const more = await changeUser(database.pool, {
      ...context(actorId),
      userId: legacy,
      version: 3,
      address: { city: "Salvador" },
      justification: "",
    });
    expect(more.address).toMatchObject({ street: "Rua gradativa", city: "Salvador" });
    await expect(
      changeUser(database.pool, {
        ...context(actorId),
        userId: legacy,
        version: 4,
        address: { street: "" },
        justification: "",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    await expect(
      changeUser(database.pool, {
        ...context(actorId),
        userId: created.id,
        version: 1,
        phone: "(71) 99999-0001",
        address: { ...contact.address, number: "42" },
        justification: "",
      }),
    ).resolves.toMatchObject({ phone: "71999990001", address: { number: "42" }, version: 2 });
    await expect(
      changeUser(database.pool, {
        ...context(actorId),
        userId: created.id,
        version: 1,
        phone: "71999990002",
        justification: "",
      }),
    ).rejects.toMatchObject({ code: "USER_VERSION_CONFLICT" });
    const events = await admin.query("SELECT * FROM audit_event WHERE entity_id=$1", [created.id]);
    expect(JSON.stringify(events.rows)).not.toContain(contact.cpf);
    expect(JSON.stringify(events.rows)).not.toContain(contact.address.street);
    expect(JSON.stringify(events.rows)).not.toContain("71999990001");
  });
});

it("serializes different grants, rejects a second role and allows an audited replacement after revocation", async () => {
  const actorId = await seedUser("manager@example.test");
  const targetUserId = await seedUser("single-role@example.test");
  const roleIds = [await seedRole("manager"), await seedRole("collaborator")];
  const results = await Promise.allSettled(
    roleIds.map((roleId) =>
      grantRole(database.pool, {
        ...context(actorId),
        targetUserId,
        roleId,
        justification: "",
      }),
    ),
  );
  expect(results.filter((item) => item.status === "fulfilled")).toHaveLength(1);
  expect(results.find((item) => item.status === "rejected")).toMatchObject({
    reason: { code: "USER_ROLE_CONFLICT", status: 409 },
  });
  const active = (
    await admin.query("SELECT role_id FROM user_role WHERE user_id=$1 AND revoked_at IS NULL", [
      targetUserId,
    ])
  ).rows;
  expect(active).toHaveLength(1);
  const next = roleIds.find((id) => id !== active[0].role_id)!;
  await expect(
    admin.query(
      "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES($1,$2,$3,'')",
      [targetUserId, next, actorId],
    ),
  ).rejects.toMatchObject({ code: "23P01", constraint: "user_role_single_period" });
  await revokeRole(database.pool, {
    ...context(actorId),
    targetUserId,
    roleId: active[0].role_id,
    reason: "",
  });
  await grantRole(database.pool, {
    ...context(actorId),
    targetUserId,
    roleId: next,
    justification: "",
  });
  expect(
    (
      await admin.query("SELECT role_id FROM user_role WHERE user_id=$1 AND revoked_at IS NULL", [
        targetUserId,
      ])
    ).rows,
  ).toEqual([{ role_id: next }]);
  expect(
    (
      await admin.query(
        "SELECT action FROM audit_event WHERE entity_id=$1 ORDER BY occurred_at,id",
        [targetUserId],
      )
    ).rows.map((row) => row.action),
  ).toEqual(["user.role.granted", "user.role.revoked", "user.role.granted"]);
});

it("allows granting again after the earlier validity has expired without deleting history", async () => {
  const actorId = await seedUser("manager@example.test");
  const targetUserId = await seedUser("expired-role@example.test");
  const roleId = await seedRole("collaborator");
  await admin.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_from,valid_until) VALUES($1,$2,$3,'',now()-interval '2 days',now()-interval '1 day')",
    [targetUserId, roleId, actorId],
  );
  await grantRole(database.pool, { ...context(actorId), targetUserId, roleId, justification: "" });
  expect(
    (await admin.query("SELECT id FROM user_role WHERE user_id=$1", [targetUserId])).rowCount,
  ).toBe(2);
});

async function promotionFixture() {
  const actorId = await seedUser("manager@example.test");
  const targetUserId = await seedUser("promotion@example.test");
  const roleId = await seedRole("collaborator"),
    managerId = await seedRole("manager");
  const validUntil = new Date(Date.now() + 3600000);
  await grantRole(database.pool, {
    ...context(actorId),
    targetUserId,
    roleId,
    justification: "",
    validUntil,
  });
  await admin.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['users:read'],$2)",
    [targetUserId, actorId],
  );
  return {
    actorId,
    targetUserId,
    roleId,
    managerId,
    validUntil,
    command: { ...context(actorId), targetUserId, roleId },
  };
}
it("promotes one level at a time, preserving individual access, validity and auditable history", async () => {
  const f = await promotionFixture();
  const access = (await admin.query("SELECT * FROM user_access WHERE user_id=$1", [f.targetUserId]))
    .rows;
  await promoteRole(database.pool, f.command);
  let current = (
    await admin.query(
      "SELECT role_id,valid_until FROM user_role WHERE user_id=$1 AND revoked_at IS NULL",
      [f.targetUserId],
    )
  ).rows;
  expect(current).toEqual([{ role_id: f.managerId, valid_until: f.validUntil }]);
  await promoteRole(database.pool, { ...f.command, roleId: f.managerId });
  const administrator = await seedRole("administrator", true);
  current = (
    await admin.query(
      "SELECT role_id,valid_until FROM user_role WHERE user_id=$1 AND revoked_at IS NULL",
      [f.targetUserId],
    )
  ).rows;
  expect(current).toEqual([{ role_id: administrator, valid_until: f.validUntil }]);
  await expect(
    promoteRole(database.pool, { ...f.command, roleId: administrator }),
  ).rejects.toMatchObject({ code: "ROLE_PROMOTION_UNAVAILABLE" });
  expect(
    (await admin.query("SELECT * FROM user_access WHERE user_id=$1", [f.targetUserId])).rows,
  ).toEqual(access);
  expect(
    (await admin.query("SELECT id FROM user_role WHERE user_id=$1", [f.targetUserId])).rowCount,
  ).toBe(3);
  expect(
    (
      await admin.query(
        "SELECT id FROM audit_event WHERE entity_id=$1 AND after->>'promotion'='true'",
        [f.targetUserId],
      )
    ).rowCount,
  ).toBe(4);
});
it("prevents a double click from promoting two levels", async () => {
  const f = await promotionFixture();
  const result = await Promise.allSettled([
    promoteRole(database.pool, f.command),
    promoteRole(database.pool, f.command),
  ]);
  expect(result.filter((item) => item.status === "fulfilled")).toHaveLength(1);
  expect(result.find((item) => item.status === "rejected")).toMatchObject({
    reason: { code: "ROLE_PROMOTION_CONFLICT", status: 409 },
  });
  expect(
    (
      await admin.query("SELECT role_id FROM user_role WHERE user_id=$1 AND revoked_at IS NULL", [
        f.targetUserId,
      ])
    ).rows,
  ).toEqual([{ role_id: f.managerId }]);
});
it("rolls back revocation, grant, security and audit if promotion auditing fails", async () => {
  const f = await promotionFixture();
  const before = (await admin.query("SELECT * FROM user_role WHERE user_id=$1", [f.targetUserId]))
    .rows;
  const events = (await admin.query("SELECT * FROM audit_event ORDER BY id")).rows;
  const security = (await admin.query("SELECT * FROM security_event ORDER BY id")).rows;
  const { writeAuditEvent } = await import("@caab/db/repositories/audit-writer");
  await expect(
    promoteRole(database.pool, f.command, {
      writeAudit: async (client, input) => {
        if (input.action === "user.role.granted")
          throw new Error("synthetic promotion audit failure");
        return writeAuditEvent(client, input);
      },
    }),
  ).rejects.toThrow("synthetic promotion audit failure");
  expect(
    (await admin.query("SELECT * FROM user_role WHERE user_id=$1", [f.targetUserId])).rows,
  ).toEqual(before);
  expect((await admin.query("SELECT * FROM audit_event ORDER BY id")).rows).toEqual(events);
  expect((await admin.query("SELECT * FROM security_event ORDER BY id")).rows).toEqual(security);
});
it("denies promotion by managers, expired sessions, for inactive targets and unavailable successors", async () => {
  const f = await promotionFixture();
  await admin.query("UPDATE role SET status='inactive' WHERE id=$1", [f.managerId]);
  await expect(promoteRole(database.pool, f.command)).rejects.toMatchObject({
    code: "ROLE_PROMOTION_UNAVAILABLE",
  });
  await admin.query("UPDATE role SET status='active' WHERE id=$1", [f.managerId]);
  await admin.query("UPDATE session SET revoked_at=now() WHERE user_id=$1", [f.actorId]);
  await expect(promoteRole(database.pool, f.command)).rejects.toMatchObject({ status: 401 });
  await admin.query("UPDATE session SET revoked_at=NULL WHERE user_id=$1", [f.actorId]);
  await admin.query("UPDATE \"user\" SET status='disabled' WHERE id=$1", [f.targetUserId]);
  await expect(promoteRole(database.pool, f.command)).rejects.toMatchObject({
    code: "USER_NOT_FOUND",
  });
  await admin.query("UPDATE \"user\" SET status='active' WHERE id=$1", [f.targetUserId]);
  await revokeRole(database.pool, { ...f.command, reason: "" });
  await grantRole(database.pool, { ...f.command, roleId: f.managerId, justification: "" });
  await expect(
    promoteRole(database.pool, { ...f.command, actor: context(f.targetUserId).actor }),
  ).rejects.toMatchObject({ status: 403 });
});

it("does not promote expired or unranked legacy assignments", async () => {
  const f = await promotionFixture();
  await admin.query(
    "UPDATE user_role SET valid_from=now()-interval '2 days',valid_until=now()-interval '1 day' WHERE user_id=$1",
    [f.targetUserId],
  );
  await expect(promoteRole(database.pool, f.command)).rejects.toMatchObject({
    code: "ROLE_PROMOTION_CONFLICT",
  });
  const legacy = await seedRole("legacy-role");
  await grantRole(database.pool, { ...f.command, roleId: legacy, justification: "" });
  await expect(promoteRole(database.pool, { ...f.command, roleId: legacy })).rejects.toMatchObject({
    code: "ROLE_PROMOTION_UNAVAILABLE",
  });
  expect(
    (
      await admin.query(
        "SELECT role_id FROM user_role WHERE user_id=$1 AND revoked_at IS NULL AND valid_until IS NULL",
        [f.targetUserId],
      )
    ).rows,
  ).toEqual([{ role_id: legacy }]);
});
