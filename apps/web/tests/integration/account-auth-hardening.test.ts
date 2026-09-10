import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { verifyPassword } from "better-auth/crypto";
import { createAuth } from "../../modules/auth/auth-factory";
import { resetIdentifier } from "../../modules/auth/password-recovery-service";
import { changeAccountSettings } from "../../modules/auth/account-settings-service";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";

const origin = "https://caab.example.test";
const password = "SyntheticHardeningPassword2026";
const newPassword = "SyntheticHardeningNewPassword2026";
let container: Awaited<ReturnType<typeof startPostgres>>;
let database: ReturnType<typeof createDatabaseClient>;
let auth: ReturnType<typeof createAuth>;
const links = new Map<string, string>();
function request(path: string, body?: unknown, cookie = "", requestOrigin = origin) {
  return new Request(`${origin}/api/auth${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { origin: requestOrigin, "content-type": "application/json", cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
function sessionCookie(response: Response) {
  return (
    /(?:^|, )((?:__Secure-)?caab\.session=[^;]+)/.exec(
      response.headers.get("set-cookie") ?? "",
    )?.[1] ?? ""
  );
}
async function account() {
  const email = `hardening-${randomUUID()}@example.test`;
  const response = await auth.handler(
    request("/sign-up/email", { email, name: "Synthetic Account", password }),
  );
  expect(response.status).toBe(200);
  const { user } = await response.json();
  return { id: user.id as string, email, cookie: sessionCookie(response) };
}
async function resetLink(email: string) {
  expect((await auth.handler(request("/request-password-reset", { email }))).status).toBe(200);
  return links.get(email)!;
}
async function auditFailure(userId: string, action: string) {
  // IDs/actions are generated or fixed test constants; this trigger exists only in the disposable database.
  await database.pool.query(
    `CREATE OR REPLACE FUNCTION fail_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.entity_id='${userId}' AND NEW.action='${action}' THEN RAISE EXCEPTION 'simulated audit failure'; END IF; RETURN NEW; END $$`,
  );
  await database.pool.query(
    "CREATE TRIGGER fail_test_audit BEFORE INSERT ON audit_event FOR EACH ROW EXECUTE FUNCTION fail_test_audit()",
  );
}
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  database = createDatabaseClient(container.getConnectionUri());
  auth = createAuth({
    database: database.db,
    pool: database.pool,
    baseURL: origin,
    secret: "synthetic-hardening-only-secret-at-least-32",
    disableRateLimit: true,
    sendResetPassword: async ({ user, token }) => {
      links.set(user.email, token);
    },
  });
}, 120000);
afterAll(async () => {
  await database?.close();
  await container?.stop();
});

describe.sequential("account authentication boundaries", () => {
  it("removes legacy authenticator data with audit and keeps password login working", async () => {
    const user = await account();
    const token = await resetLink(user.email);
    await database.pool.query('UPDATE "user" SET two_factor_enabled=true WHERE id=$1', [user.id]);
    await database.pool.query(
      "INSERT INTO two_factor(id,user_id,secret,backup_codes,verified) VALUES ($1,$2,'synthetic-only-secret','synthetic-only-codes',true)",
      [randomUUID(), user.id],
    );
    await database.pool.query(
      "INSERT INTO verification(id,identifier,value,expires_at) VALUES ($1,'2fa-synthetic-test',$2,now()+interval '5 minutes')",
      [randomUUID(), user.id],
    );
    const migration = await readFile(
      new URL("../../../../packages/db/migrations/0012_remove_authenticator.sql", import.meta.url),
      "utf8",
    );
    await database.pool.query(migration);
    expect(
      (await database.pool.query("SELECT id FROM two_factor WHERE user_id=$1", [user.id])).rowCount,
    ).toBe(0);
    expect(
      (
        await database.pool.query(
          "SELECT id FROM verification WHERE identifier='2fa-synthetic-test'",
        )
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await database.pool.query("SELECT id FROM verification WHERE identifier=$1", [
          resetIdentifier(token),
        ])
      ).rowCount,
    ).toBe(1);
    expect(
      (
        await database.pool.query(
          "SELECT id FROM audit_event WHERE entity_id=$1 AND action='user.authenticator.removed'",
          [user.id],
        )
      ).rowCount,
    ).toBe(1);
    const login = await auth.handler(request("/sign-in/email", { email: user.email, password }));
    expect(login.status).toBe(200);
    expect(await login.json()).not.toHaveProperty("twoFactorRedirect");
  });
  it("enforces recovery request and reset attempt limits with rate limiting enabled", async () => {
    const limited = createAuth({
      database: database.db,
      pool: database.pool,
      baseURL: origin,
      secret: "synthetic-rate-only-secret-at-least-32-chars",
      sendResetPassword: async () => {},
    });
    const send = (path: string, body: unknown) => {
      const req = request(path, body);
      req.headers.set("x-forwarded-for", "203.0.113.77");
      return limited.handler(req);
    };
    for (let index = 0; index < 3; index++)
      expect(
        (await send("/request-password-reset", { email: "unknown-limit@example.test" })).status,
      ).toBe(200);
    expect(
      (await send("/request-password-reset", { email: "unknown-limit@example.test" })).status,
    ).toBe(429);
    for (let index = 0; index < 5; index++)
      expect((await send("/reset-password", { token: "a".repeat(64), newPassword })).status).toBe(
        400,
      );
    expect((await send("/reset-password", { token: "a".repeat(64), newPassword })).status).toBe(
      429,
    );
  });
  it.each(["revoked", "disabled"])(
    "rejects session reads and removed authenticator endpoints for a %s account/session",
    async (state) => {
      const user = await account();
      if (state === "revoked")
        await database.pool.query("UPDATE session SET revoked_at=now() WHERE user_id=$1", [
          user.id,
        ]);
      else
        await database.pool.query(
          "UPDATE \"user\" SET status='disabled',deactivated_at=now() WHERE id=$1",
          [user.id],
        );
      expect(
        (await auth.handler(request("/two-factor/enable", { password }, user.cookie))).status,
      ).toBe(404);
      expect(
        (await database.pool.query("SELECT id FROM two_factor WHERE user_id=$1", [user.id]))
          .rowCount,
      ).toBe(0);
      expect(
        await (await auth.handler(request("/get-session", undefined, user.cookie))).json(),
      ).toBeNull();
    },
  );
  it("blocks alternative account mutations and unsupported MFA endpoints", async () => {
    const user = await account();
    for (const path of [
      "/change-password",
      "/set-password",
      "/update-user",
      "/change-email",
      "/delete-user",
      "/two-factor/disable",
      "/two-factor/generate-backup-codes",
      "/two-factor/get-totp-uri",
    ]) {
      expect(
        (
          await auth.handler(
            request(
              path,
              {
                currentPassword: password,
                newPassword,
                password,
                name: "Changed",
                email: "changed@example.test",
              },
              user.cookie,
            ),
          )
        ).status,
      ).toBe(404);
    }
    const {
      rows: [row],
    } = await database.pool.query("SELECT password FROM account WHERE user_id=$1", [user.id]);
    expect(await verifyPassword({ hash: row.password, password })).toBe(true);
  });
  it("rolls back password, token, sessions and audit together after an audit failure", async () => {
    const user = await account();
    const token = await resetLink(user.email);
    await auditFailure(user.id, "user.password.reset");
    try {
      expect((await auth.handler(request("/reset-password", { token, newPassword }))).status).toBe(
        500,
      );
    } finally {
      await database.pool.query("DROP TRIGGER fail_test_audit ON audit_event");
    }
    const {
      rows: [row],
    } = await database.pool.query("SELECT password FROM account WHERE user_id=$1", [user.id]);
    expect(await verifyPassword({ hash: row.password, password })).toBe(true);
    expect(
      (
        await database.pool.query("SELECT id FROM verification WHERE identifier=$1", [
          resetIdentifier(token),
        ])
      ).rowCount,
    ).toBe(1);
    expect(
      (await database.pool.query("SELECT id FROM session WHERE user_id=$1", [user.id])).rowCount,
    ).toBe(1);
    expect((await auth.handler(request("/reset-password", { token, newPassword }))).status).toBe(
      200,
    );
    expect(
      (await database.pool.query("SELECT id FROM session WHERE user_id=$1", [user.id])).rowCount,
    ).toBe(0);
  });
  it("rejects cross-origin reset and allows exactly one concurrent consumption", async () => {
    const user = await account();
    const token = await resetLink(user.email);
    expect(
      (
        await auth.handler(
          request("/reset-password", { token, newPassword }, "", "https://untrusted.example.test"),
        )
      ).status,
    ).toBe(403);
    const results = await Promise.all([
      auth.handler(request("/reset-password", { token, newPassword })),
      auth.handler(request("/reset-password", { token, newPassword })),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
    expect(
      (
        await database.pool.query(
          "SELECT id FROM audit_event WHERE entity_id=$1 AND action='user.password.reset'",
          [user.id],
        )
      ).rowCount,
    ).toBe(1);
  });
  it("invalidates older reset links on a new request and on a settings password change", async () => {
    const user = await account();
    const previous = await resetLink(user.email);
    const latest = await resetLink(user.email);
    expect(latest).not.toBe(previous);
    expect(
      (await auth.handler(request("/reset-password", { token: previous, newPassword }))).status,
    ).toBe(400);
    const {
      rows: [session],
    } = await database.pool.query("SELECT id FROM session WHERE user_id=$1", [user.id]);
    await changeAccountSettings(database.pool, {
      actor: { userId: user.id, sessionId: session.id, permissions: new Set(), mfaVerified: false },
      input: {
        action: "password",
        currentPassword: password,
        newPassword,
        confirmPassword: newPassword,
        version: 1,
      },
      requestId: randomUUID(),
      sendEmail: async () => {},
    });
    expect(
      (await auth.handler(request("/reset-password", { token: latest, newPassword }))).status,
    ).toBe(400);
  });
  it("rejects a disabled account's previously issued reset link", async () => {
    const user = await account();
    const token = await resetLink(user.email);
    await database.pool.query(
      "UPDATE \"user\" SET status='disabled',deactivated_at=now() WHERE id=$1",
      [user.id],
    );
    expect((await auth.handler(request("/reset-password", { token, newPassword }))).status).toBe(
      400,
    );
  });
  it("returns the same unavailability for known and unknown emails and rolls back undelivered tokens", async () => {
    const user = await account();
    let sent = 0;
    const unavailable = createAuth({
      database: database.db,
      pool: database.pool,
      baseURL: origin,
      secret: "synthetic-hardening-only-secret-at-least-32",
      disableRateLimit: true,
      checkMailAvailable: async () => {
        throw new Error("SMTP down");
      },
      sendResetPassword: async () => {
        sent++;
      },
    });
    for (const email of [user.email, "unknown@example.test"])
      expect(
        (await unavailable.handler(request("/request-password-reset", { email }))).status,
      ).toBe(503);
    expect(sent).toBe(0);
    const failedDelivery = createAuth({
      database: database.db,
      pool: database.pool,
      baseURL: origin,
      secret: "synthetic-hardening-only-secret-at-least-32",
      disableRateLimit: true,
      sendResetPassword: async () => {
        throw new Error("SMTP delivery failed");
      },
    });
    expect(
      (await failedDelivery.handler(request("/request-password-reset", { email: user.email })))
        .status,
    ).toBe(503);
    expect(
      (
        await database.pool.query(
          "SELECT id FROM verification WHERE value=$1 AND identifier LIKE 'caab-reset:%'",
          [user.id],
        )
      ).rowCount,
    ).toBe(0);
  });
});
