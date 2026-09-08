import { createHmac } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { createAuth } from "../../modules/auth/auth-factory";
import { loadActiveSession } from "../../modules/auth/session-dal";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";

const origin = "https://caab.example.test";
const password = "Synthetic-Only-Password-1!";
let container: StartedPostgreSqlContainer;
let admin: Client;
let database: ReturnType<typeof createDatabaseClient>;
let handler: (request: Request) => Promise<Response>;
let cookie = "";
let userId = "";
let persistedToken = "";

function authRequest(path: string, body?: unknown, sessionCookie = cookie): Request {
  return new Request(`${origin}/api/auth${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json", origin }),
      ...(sessionCookie ? { cookie: sessionCookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function sessionCookie(response: Response): string {
  const value = response.headers.get("set-cookie") ?? "";
  const match = /(?:^|, )((?:__Secure-)?caab\.session=[^;]+)/.exec(value);
  if (!match?.[1]) throw new Error(`Session cookie missing from: ${value}`);
  return match[1];
}

function totpCode(uri: string): string {
  const secret = new URL(uri).searchParams.get("secret");
  if (!secret) throw new Error("TOTP URI has no secret");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of secret.replace(/=+$/, "").toUpperCase()) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 secret");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = Buffer.alloc(Math.floor(bits.length / 8));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", bytes).update(counter).digest();
  const offset = (digest.at(-1) ?? 0) & 0x0f;
  const binary = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return binary.toString().padStart(6, "0");
}

beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  database = createDatabaseClient(container.getConnectionUri());
  const auth = createAuth({
    database: database.db,
    baseURL: origin,
    secret: "test-only-secret-with-at-least-32-characters",
  });
  handler = auth.handler;
}, 120_000);

afterAll(async () => {
  await database?.close();
  await admin?.end();
  await container?.stop();
});

describe.sequential("Better Auth PostgreSQL sessions", () => {
  it("persists an opaque session and emits a hardened cookie without a session cache", async () => {
    const response = await handler(
      authRequest("/sign-up/email", {
        email: "ordinary@example.test",
        name: "Ordinary User",
        password,
      }),
    );
    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/caab\.session=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Secure/i);
    expect(setCookie).toMatch(/SameSite=Strict/i);
    expect(setCookie).not.toMatch(/session_data=/);

    cookie = sessionCookie(response);
    const payload = (await response.json()) as { user: { id: string } };
    userId = payload.user.id;
    const rows = await admin.query<{ token: string }>(
      "SELECT token FROM session WHERE user_id = $1",
      [userId],
    );
    expect(rows.rows).toHaveLength(1);
    persistedToken = rows.rows[0]?.token ?? "";
    expect(cookie).toContain(encodeURIComponent(persistedToken));
  });

  it("enrolls TOTP only after confirmation and never enables trusted-device bypass", async () => {
    const enable = await handler(
      authRequest("/two-factor/enable", { password, method: "totp", issuer: "CAAB" }),
    );
    expect(enable.status).toBe(200);
    const enrollment = (await enable.json()) as { totpURI: string; backupCodes: string[] };
    expect(enrollment.backupCodes.length).toBeGreaterThan(0);

    const pending = await admin.query<{ verified: boolean }>(
      "SELECT verified FROM two_factor WHERE user_id = $1",
      [userId],
    );
    expect(pending.rows[0]?.verified).toBe(false);

    const verify = await handler(
      authRequest("/two-factor/verify-totp", {
        code: totpCode(enrollment.totpURI),
        trustDevice: false,
      }),
    );
    expect(verify.status).toBe(200);
    const enabled = await admin.query<{ two_factor_enabled: boolean; verified: boolean }>(
      `SELECT u.two_factor_enabled, tf.verified
       FROM "user" u JOIN two_factor tf ON tf.user_id = u.id WHERE u.id = $1`,
      [userId],
    );
    expect(enabled.rows[0]).toEqual({ two_factor_enabled: true, verified: true });
  });

  it("observes session revocation on the next protected lookup", async () => {
    const current = await admin.query<{ token: string }>(
      "SELECT token FROM session WHERE user_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1",
      [userId],
    );
    expect(current.rows).toHaveLength(1);
    persistedToken = current.rows[0]?.token ?? "";
    expect(await loadActiveSession(database.pool, persistedToken)).not.toBeNull();
    await admin.query("UPDATE session SET revoked_at = now() WHERE token = $1", [persistedToken]);
    expect(await loadActiveSession(database.pool, persistedToken)).toBeNull();
  });

  it("denies an inactive user even when a persisted session has not expired", async () => {
    await admin.query(
      `UPDATE "user" SET status = 'disabled', deactivated_at = now() WHERE id = $1`,
      [userId],
    );
    const token = crypto.randomUUID();
    await admin.query(
      `INSERT INTO session (id, token, user_id, expires_at)
       VALUES ($1, $1, $2, now() + interval '1 hour')`,
      [token, userId],
    );
    expect(await loadActiveSession(database.pool, token)).toBeNull();
  });
});
