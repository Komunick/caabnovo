import { Client } from "pg";
import { runMigrations } from "@caab/db";
import { provisionTestUser } from "../support/provision-user";
import { assertLocalSeedTarget } from "../support/local-seed-target";
import { syntheticUsers } from "./fixtures";

const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const adminUrl =
  process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab";

export default async function globalSetup() {
  assertLocalSeedTarget({ ...process.env, BETTER_AUTH_URL: origin, DATABASE_ADMIN_URL: adminUrl });
  await runMigrations(adminUrl);
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();

  async function ensureUser(user: { email: string; password: string }, name: string) {
    const existing = await admin.query<{ two_factor_enabled: boolean }>(
      'SELECT two_factor_enabled FROM "user" WHERE email = $1',
      [user.email],
    );
    if (existing.rows[0]) return existing.rows[0].two_factor_enabled;
    await provisionTestUser(admin, { ...user, name });
  }

  try {
    await ensureUser(syntheticUsers.ordinary, "Usuário Sintético");
    await ensureUser(syntheticUsers.accessManager, "Gestor de Acesso Sintético");
    await ensureUser(syntheticUsers.auditor, "Auditor Sintético");
    await ensureUser(syntheticUsers.operator, "Operador Sintético");
    await ensureUser(syntheticUsers.administrator, "Administrador Sintético");

    // Existing editorial tests use an explicit fixture role, not implicit production access.
    await admin.query(
      `INSERT INTO role(code,name,description) VALUES ('synthetic-editor','Editor sintético','Fixture editorial') ON CONFLICT (code) DO NOTHING`,
    );
    await admin.query(`INSERT INTO role_permission(role_id,permission_id)
      SELECT r.id,p.id FROM role r CROSS JOIN permission p
      WHERE r.code='synthetic-editor' AND p.resource='news' AND p.action IN ('read','write','publish') ON CONFLICT DO NOTHING`);
    await admin.query(
      `INSERT INTO user_role(user_id,role_id,granted_by,justification)
      SELECT u.id,r.id,u.id,'Fixture editorial explícita' FROM "user" u CROSS JOIN role r
      WHERE u.email=ANY($1::citext[]) AND r.code='synthetic-editor' ON CONFLICT DO NOTHING`,
      [Object.values(syntheticUsers).map((user) => user.email)],
    );

    const users = await admin.query<{ id: string; email: string }>(
      `SELECT id, email::text FROM "user" WHERE email = ANY($1::citext[])`,
      [
        [
          syntheticUsers.accessManager.email,
          syntheticUsers.auditor.email,
          syntheticUsers.operator.email,
          syntheticUsers.administrator.email,
        ],
      ],
    );
    const userIds = new Map(users.rows.map(({ email, id }) => [email, id]));
    const memberPermissions = [
      "messages:access",
      "members:read",
      "members:write",
      "members:review",
      "partners:read",
      "partners:write",
      "partners:publish",
    ];
    const permissions = [
      "users:read",
      "users:create",
      "users:update",
      "users:disable",
      "roles:read",
      "roles:grant",
      "roles:revoke",
      "audit:read",
      "audit:export",
      "files:create",
      "files:read",
      "files:delete",
      "jobs:read",
      "jobs:redrive",
    ];
    const permissionIds = new Map<string, string>();
    for (const permission of [...permissions, ...memberPermissions]) {
      const [resource, action] = permission.split(":");
      const inserted = await admin.query<{ id: string }>(
        `INSERT INTO permission (resource, action, description, sensitive)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (resource, action) DO UPDATE SET description = EXCLUDED.description
         RETURNING id`,
        [resource, action, `Synthetic ${permission}`, action !== "read"],
      );
      permissionIds.set(permission, inserted.rows[0]!.id);
    }
    const roleDefinitions = [
      {
        code: "synthetic-job-reader",
        name: "Consulta de processamentos",
        administrative: false,
        permissions: ["jobs:read"],
        userId: userIds.get(syntheticUsers.operator.email),
      },
      {
        code: "access-manager",
        name: "Gestor de acesso",
        administrative: false,
        permissions,
        userId: userIds.get(syntheticUsers.accessManager.email),
      },
      {
        code: "auditor",
        name: "Auditor",
        administrative: false,
        permissions: ["audit:read", "audit:export"],
        userId: userIds.get(syntheticUsers.auditor.email),
      },
      {
        code: "administrator",
        name: "Administrador",
        administrative: true,
        permissions: [...permissions, ...memberPermissions],
        userId: userIds.get(syntheticUsers.administrator.email),
      },
      {
        code: "user-viewer",
        name: "Consulta de usuários",
        administrative: false,
        permissions: ["users:read"],
        userId: undefined,
      },
    ];
    for (const definition of roleDefinitions) {
      const inserted = await admin.query<{ id: string }>(
        `INSERT INTO role (code, name, description, is_administrative)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name, description = EXCLUDED.description,
           is_administrative = EXCLUDED.is_administrative, status = 'active', deleted_at = NULL
         RETURNING id`,
        [
          definition.code,
          definition.name,
          `Synthetic ${definition.name}`,
          definition.administrative,
        ],
      );
      const roleId = inserted.rows[0]!.id;
      for (const permission of definition.permissions) {
        await admin.query(
          `INSERT INTO role_permission (role_id, permission_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [roleId, permissionIds.get(permission)],
        );
      }
      if (definition.userId) {
        await admin.query(
          `INSERT INTO user_role (user_id, role_id, granted_by, justification)
           VALUES ($1, $2, $1, 'Bootstrap sintético E2E')
           ON CONFLICT DO NOTHING`,
          [definition.userId, roleId],
        );
      }
    }
    const managerId = userIds.get(syntheticUsers.accessManager.email);
    if (managerId) {
      await admin.query(
        `INSERT INTO audit_event
          (actor_user_id, effective_identity, action, entity_type, entity_id, before, after,
           reason, origin, request_id, correlation_id)
         SELECT $1::uuid, $2, 'user.updated', 'user', $1::text, $3, $4,
           'Fixture sintética E2E', 'system', gen_random_uuid(), gen_random_uuid()
         WHERE NOT EXISTS (
           SELECT 1 FROM audit_event
           WHERE actor_user_id = $1::uuid
             AND action = 'user.updated'
             AND entity_type = 'user'
             AND entity_id = $1::text
             AND reason = 'Fixture sintética E2E'
         )`,
        [
          managerId,
          `user:${managerId}`,
          JSON.stringify({ name: "Nome anterior sintético", status: "inactive" }),
          JSON.stringify({ name: "Gestor de Acesso Sintético", status: "active", version: 1 }),
        ],
      );
    }
  } finally {
    await admin.end();
  }
}
