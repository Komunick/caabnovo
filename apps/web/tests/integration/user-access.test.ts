import { syntheticUserContact } from "../helpers/user-contact";
import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { grantRole, revokeRole } from "../../modules/users/role-assignment-service";
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
    const { findUserById } = await import("@caab/db/repositories/users");
    expect(await findUserById(database.pool, created.id)).toMatchObject(contact);
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
