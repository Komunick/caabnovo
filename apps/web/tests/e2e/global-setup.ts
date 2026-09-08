import { createHmac } from "node:crypto";
import { Client } from "pg";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { createAuth } from "../../modules/auth/auth-factory";
import { syntheticUsers } from "./fixtures";

const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const adminUrl =
  process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab";

function cookieFrom(response: Response): string {
  const value = response.headers.get("set-cookie") ?? "";
  const match = /(?:^|, )((?:__Secure-)?caab\.session=[^;]+)/.exec(value);
  if (!match?.[1]) throw new Error("The synthetic user session cookie was not issued");
  return match[1];
}

function totpCode(uri: string): string {
  const secret = new URL(uri).searchParams.get("secret");
  if (!secret) throw new Error("TOTP URI has no secret");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of secret.replace(/=+$/, "").toUpperCase()) {
    bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  }
  const bytes = Buffer.alloc(Math.floor(bits.length / 8));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", bytes).update(counter).digest();
  const offset = (digest.at(-1) ?? 0) & 0x0f;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

export default async function globalSetup() {
  await runMigrations(adminUrl);
  const database = createDatabaseClient(adminUrl);
  const auth = createAuth({
    database: database.db,
    baseURL: origin,
    secret: process.env.BETTER_AUTH_SECRET ?? "e2e-only-secret-with-at-least-32-characters",
    disableRateLimit: true,
  });
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();

  async function post(path: string, body: unknown, cookie = "") {
    return auth.handler(
      new Request(`${origin}/api/auth${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(body),
      }),
    );
  }

  async function ensureUser(user: { email: string; password: string }, name: string) {
    const existing = await admin.query<{ two_factor_enabled: boolean }>(
      'SELECT two_factor_enabled FROM "user" WHERE email = $1',
      [user.email],
    );
    if (existing.rows[0]) return existing.rows[0].two_factor_enabled;
    const response = await post("/sign-up/email", { ...user, name });
    if (!response.ok) throw new Error(`Unable to create synthetic user: ${response.status}`);
    return cookieFrom(response);
  }

  try {
    await ensureUser(syntheticUsers.ordinary, "Usuário Sintético");
    await ensureUser(syntheticUsers.accessManager, "Gestor de Acesso Sintético");
    await ensureUser(syntheticUsers.auditor, "Auditor Sintético");
    const adminState = await ensureUser(syntheticUsers.administrator, "Administrador Sintético");
    if (adminState !== true) {
      const cookie =
        typeof adminState === "string"
          ? adminState
          : cookieFrom(
              await post("/sign-in/email", {
                email: syntheticUsers.administrator.email,
                password: syntheticUsers.administrator.password,
              }),
            );
      const enable = await post(
        "/two-factor/enable",
        { password: syntheticUsers.administrator.password, method: "totp", issuer: "CAAB" },
        cookie,
      );
      if (!enable.ok) throw new Error(`Unable to enroll synthetic MFA: ${enable.status}`);
      const enrollment = (await enable.json()) as { totpURI: string };
      const verify = await post(
        "/two-factor/verify-totp",
        { code: totpCode(enrollment.totpURI), trustDevice: false },
        cookie,
      );
      if (!verify.ok) throw new Error(`Unable to confirm synthetic MFA: ${verify.status}`);
    }

    const users = await admin.query<{ id: string; email: string }>(
      `SELECT id, email::text FROM "user" WHERE email = ANY($1::citext[])`,
      [
        [
          syntheticUsers.accessManager.email,
          syntheticUsers.auditor.email,
          syntheticUsers.administrator.email,
        ],
      ],
    );
    const userIds = new Map(users.rows.map(({ email, id }) => [email, id]));
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
    for (const permission of permissions) {
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
        permissions,
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
         VALUES ($1::uuid, $2, 'user.updated', 'user', $1::text, $3, $4,
           'Fixture sintética E2E', 'system', gen_random_uuid(), gen_random_uuid())`,
        [
          managerId,
          `user:${managerId}`,
          JSON.stringify({ status: "active" }),
          JSON.stringify({ status: "active", version: 1 }),
        ],
      );
    }
  } finally {
    await admin.end();
    await database.close();
  }
}
