import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { resetIdentifier } from "../../modules/auth/password-recovery-service";
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
let resetToken = "";

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

beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  database = createDatabaseClient(container.getConnectionUri());
  const auth = createAuth({
    database: database.db,
    pool: database.pool,
    baseURL: origin,
    secret: "test-only-secret-with-at-least-32-characters",
    disableRateLimit: true,
    sendResetPassword: async ({ token }) => {
      resetToken = token;
    },
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

  it("resets with a single-use expiring link, rejects weak passwords, revokes sessions", async () => {
    const requestReset = () =>
      handler(authRequest("/request-password-reset", { email: "ordinary@example.test" }, ""));
    expect((await requestReset()).status).toBe(200);
    expect(resetToken).not.toBe("");
    const expiredToken = resetToken;
    await admin.query(
      "UPDATE verification SET expires_at = now() - interval '1 minute' WHERE identifier = $1",
      [resetIdentifier(expiredToken)],
    );
    const reset = (token: string, newPassword: string) =>
      handler(authRequest("/reset-password", { token, newPassword }, ""));
    const newPassword = "NewSyntheticPassword2026";
    expect((await reset(expiredToken, newPassword)).status).toBe(400);
    expect((await requestReset()).status).toBe(200);
    const validToken = resetToken;
    for (const invalid of ["weakpassword2026", "Aa1" + "a".repeat(70)]) {
      expect((await reset(validToken, invalid)).status).toBe(400);
    }
    expect((await reset(validToken, newPassword)).status).toBe(200);
    expect((await reset(validToken, newPassword)).status).toBe(400);
    expect(
      (await admin.query("SELECT id FROM session WHERE user_id = $1", [userId])).rows,
    ).toHaveLength(0);
    expect(
      (
        await handler(
          authRequest("/sign-in/email", { email: "ordinary@example.test", password }, ""),
        )
      ).status,
    ).toBe(401);
    const login = await handler(
      authRequest("/sign-in/email", { email: "ordinary@example.test", password: newPassword }, ""),
    );
    expect(login.status).toBe(200);
    expect(await login.json()).not.toHaveProperty("twoFactorRedirect");
    const unknown = await handler(
      authRequest("/request-password-reset", { email: "unknown@example.test" }, ""),
    );
    expect(unknown.status).toBe(200);
    expect(resetToken).toBe(validToken);
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
