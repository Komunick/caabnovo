import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { changeAccountSettings } from "../../modules/auth/account-settings-service";
import type { AccountSettingsRequest } from "@caab/contracts";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";

let container: StartedPostgreSqlContainer;
let admin: Client;
let database: ReturnType<typeof createDatabaseClient>;
let userId: string;
let sessionId: string;
let token: string;
const password = "Synthetic-Settings-Password-2026!";
const newPassword = "Synthetic-Settings-Replacement-2026!";

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
  userId = crypto.randomUUID();
  sessionId = crypto.randomUUID();
  token = "";
  await admin.query(
    'INSERT INTO "user" (id,email,name,two_factor_enabled) VALUES ($1,$2,$3,true)',
    [userId, `${userId}@example.test`, "Settings User"],
  );
  await admin.query(
    "INSERT INTO account(user_id,account_id,provider_id,password) VALUES ($1::uuid,$1::text,'credential',$2)",
    [userId, await hashPassword(password)],
  );
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
});
function change(
  input: AccountSettingsRequest,
  sendEmail = async (_to: string, value: string) => {
    token = value;
  },
) {
  return changeAccountSettings(database.pool, {
    actor: { userId, sessionId, permissions: new Set(), mfaVerified: true },
    input,
    requestId: crypto.randomUUID(),
    sendEmail,
  });
}
async function identity() {
  return (
    await admin.query('SELECT name,email,version,two_factor_enabled FROM "user" WHERE id=$1', [
      userId,
    ])
  ).rows[0];
}

describe("personal account settings", () => {
  it("updates own profile without management grants, rejects stale versions and secret-free audit", async () => {
    await change({ action: "profile", name: "New name", version: 1 });
    expect((await identity()).name).toBe("New name");
    await expect(change({ action: "profile", name: "Stale", version: 1 })).rejects.toMatchObject({
      code: "VERSION_CONFLICT",
    });
    const events = await admin.query("SELECT * FROM audit_event WHERE entity_id=$1", [userId]);
    expect(events.rowCount).toBe(1);
    expect(JSON.stringify(events.rows)).not.toContain(password);
  });
  it("requires the current password, validates confirmation and preserves the credential on failure", async () => {
    await expect(
      change({
        action: "password",
        currentPassword: "Wrong",
        newPassword,
        confirmPassword: newPassword,
        version: 1,
      }),
    ).rejects.toMatchObject({ code: "INVALID_PASSWORD" });
    await expect(
      change({
        action: "password",
        currentPassword: password,
        newPassword,
        confirmPassword: password,
        version: 1,
      }),
    ).rejects.toMatchObject({ code: "PASSWORD_MISMATCH" });
    const hash = (await admin.query("SELECT password FROM account WHERE user_id=$1", [userId]))
      .rows[0].password;
    expect(await verifyPassword({ hash, password })).toBe(true);
  });
  it("changes password, revokes other sessions and preserves current identity and MFA", async () => {
    const other = crypto.randomUUID();
    await admin.query(
      "INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,now()+interval '1 hour')",
      [other, userId],
    );
    await change({
      action: "password",
      currentPassword: password,
      newPassword,
      confirmPassword: newPassword,
      version: 1,
    });
    const hash = (await admin.query("SELECT password FROM account WHERE user_id=$1", [userId]))
      .rows[0].password;
    expect(await verifyPassword({ hash, password })).toBe(false);
    expect(await verifyPassword({ hash, password: newPassword })).toBe(true);
    expect((await admin.query("SELECT id FROM session WHERE user_id=$1", [userId])).rows).toEqual([
      { id: sessionId },
    ]);
    expect((await identity()).two_factor_enabled).toBe(true);
  });
  it("keeps old email until confirmation, hashes the token, and prevents replay", async () => {
    const newEmail = `new-${userId}@example.test`;
    await change({ action: "request-email", currentPassword: password, newEmail, version: 1 });
    expect((await identity()).email).toBe(`${userId}@example.test`);
    const row = (
      await admin.query("SELECT token_hash FROM account_email_change WHERE user_id=$1", [userId])
    ).rows[0];
    expect(row.token_hash).not.toBe(token);
    await change({ action: "confirm-email", token });
    expect((await identity()).email).toBe(newEmail);
    expect((await identity()).two_factor_enabled).toBe(true);
    await expect(change({ action: "confirm-email", token })).rejects.toMatchObject({
      code: "EMAIL_LINK_INVALID",
    });
    expect(
      JSON.stringify(
        (await admin.query("SELECT * FROM audit_event WHERE entity_id=$1", [userId])).rows,
      ),
    ).not.toContain(token);
  });
  it("does not apply expired links or links belonging to another account", async () => {
    await change({
      action: "request-email",
      currentPassword: password,
      newEmail: `new-${userId}@example.test`,
      version: 1,
    });
    const otherId = crypto.randomUUID();
    const otherSessionId = crypto.randomUUID();
    await admin.query('INSERT INTO "user"(id,email,name) VALUES ($1,$2,$3)', [
      otherId,
      `${otherId}@example.test`,
      "Other settings user",
    ]);
    await admin.query(
      "INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,now()+interval '1 hour')",
      [otherSessionId, otherId],
    );
    await expect(
      changeAccountSettings(database.pool, {
        actor: {
          userId: otherId,
          sessionId: otherSessionId,
          permissions: new Set(),
          mfaVerified: false,
        },
        input: { action: "confirm-email", token },
        requestId: crypto.randomUUID(),
        sendEmail: async () => {},
      }),
    ).rejects.toMatchObject({ code: "EMAIL_LINK_INVALID" });
    await expect(change({ action: "confirm-email", token: "a".repeat(64) })).rejects.toMatchObject({
      code: "EMAIL_LINK_INVALID",
    });
    await admin.query(
      "UPDATE account_email_change SET created_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' WHERE user_id=$1",
      [userId],
    );
    await expect(change({ action: "confirm-email", token })).rejects.toMatchObject({
      code: "EMAIL_LINK_INVALID",
    });
    expect((await identity()).email).toBe(`${userId}@example.test`);
  });
  it("rolls back undelivered requests and detects an email claimed before confirmation", async () => {
    const newEmail = `conflict-${userId}@example.test`;
    await expect(
      change(
        { action: "request-email", currentPassword: password, newEmail, version: 1 },
        async () => {
          throw new Error("SMTP unavailable");
        },
      ),
    ).rejects.toMatchObject({ code: "EMAIL_DELIVERY_FAILED" });
    expect(
      (await admin.query("SELECT id FROM account_email_change WHERE user_id=$1", [userId]))
        .rowCount,
    ).toBe(0);
    await change({ action: "request-email", currentPassword: password, newEmail, version: 1 });
    await admin.query('INSERT INTO "user"(email,name) VALUES ($1::citext,$1::text)', [newEmail]);
    await expect(change({ action: "confirm-email", token })).rejects.toMatchObject({
      code: "EMAIL_UNAVAILABLE",
    });
    expect((await identity()).email).toBe(`${userId}@example.test`);
  });
  it("denies revoked sessions and rate-limits incorrect passwords", async () => {
    for (let i = 0; i < 5; i++)
      await expect(
        change({
          action: "request-email",
          currentPassword: "Wrong",
          newEmail: `new-${userId}@example.test`,
          version: 1,
        }),
      ).rejects.toMatchObject({ code: "INVALID_PASSWORD" });
    await expect(
      change({
        action: "request-email",
        currentPassword: password,
        newEmail: `new-${userId}@example.test`,
        version: 1,
      }),
    ).rejects.toMatchObject({ code: "TOO_MANY_ATTEMPTS" });
    await admin.query("UPDATE session SET revoked_at=now() WHERE id=$1", [sessionId]);
    await expect(change({ action: "profile", name: "Denied", version: 1 })).rejects.toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
  });
});
