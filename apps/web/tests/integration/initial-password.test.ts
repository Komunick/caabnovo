import { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { accessPermissionSchema } from "@caab/contracts";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { createAuth } from "../../modules/auth/auth-factory";
import { loadActiveSession } from "../../modules/auth/session-dal";
import { requestPasswordRecovery } from "../../modules/auth/password-recovery-service";
import { createUser } from "../../modules/users/user-service";
import {
  hasUserPassword,
  initializeUserPassword,
} from "../../modules/users/initial-password-service";
import { listUsers } from "@caab/db/repositories/users";
import type { RequestActor } from "../../modules/shared/request-context";

let container: StartedPostgreSqlContainer, admin: Client;
let database: ReturnType<typeof createDatabaseClient>, auth: ReturnType<typeof createAuth>;
let actor: RequestActor;
const origin = "https://panel.example.test";
const context = () => ({
  actor,
  effectiveIdentity: `user:${actor.userId}`,
  requestId: crypto.randomUUID(),
  correlationId: crypto.randomUUID(),
});
const creation = () => ({
  ...context(),
  name: "Synthetic colleague",
  email: "new@example.test",
  roleIds: [],
  idempotencyKey: crypto.randomUUID(),
});
async function signIn(email: string, password: string) {
  return auth.handler(
    new Request(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}
async function legacy() {
  return (
    await admin.query(
      "INSERT INTO \"user\"(name,email) VALUES ('Synthetic legacy','legacy@example.test') RETURNING id",
    )
  ).rows[0].id as string;
}

beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  database = createDatabaseClient(url.toString());
  auth = createAuth({
    database: database.db,
    pool: database.pool,
    baseURL: origin,
    secret: "synthetic-initial-password-test-secret",
    disableRateLimit: true,
  });
}, 120_000);
afterAll(async () => {
  await database?.close();
  await admin?.end();
  await container?.stop();
});
beforeEach(async () => {
  await admin.query('TRUNCATE "user",idempotency_record CASCADE');
  const userId = (
    await admin.query(
      "INSERT INTO \"user\"(name,email) VALUES ('Manager','manager@example.test') RETURNING id",
    )
  ).rows[0].id;
  await admin.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES ($1,$2,$1)", [
    userId,
    accessPermissionSchema.options,
  ]);
  const token = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,now()+interval '1 hour')",
    [token, userId],
  );
  actor = (await loadActiveSession(database.pool, token))!;
});

describe("initial credential provisioning", () => {
  it("creates a working credential, supports recovery and stores no plaintext in reads or audit", async () => {
    const created = await createUser(database.pool, creation());
    expect(created.initialPassword).toMatch(/^[A-Z][a-z]{5,}\d{6}$/);
    const password = created.initialPassword!;
    const stored = (
      await admin.query("SELECT password,account_id,provider_id FROM account WHERE user_id=$1", [
        created.id,
      ])
    ).rows;
    expect(stored).toHaveLength(1);
    expect(stored[0].password === password).toBe(false);
    expect(stored[0].account_id).toBe(created.id);
    expect((await signIn(created.email, password)).status).toBe(200);
    let resetSent = false;
    await requestPasswordRecovery(database.pool, created.email, async () => {
      resetSent = true;
    });
    expect(resetSent).toBe(true);
    const reads = JSON.stringify(await listUsers(database.pool, { limit: 100 }));
    const audit = JSON.stringify((await admin.query("SELECT * FROM audit_event")).rows);
    const security = JSON.stringify((await admin.query("SELECT * FROM security_event")).rows);
    expect(
      [reads, audit, security].some(
        (text) => text.includes(password) || text.includes(stored[0].password),
      ),
    ).toBe(false);
  });
  it("replays concurrent requests without replacing or returning the credential again", async () => {
    const command = creation();
    const results = await Promise.all([
      createUser(database.pool, command),
      createUser(database.pool, command),
    ]);
    expect(results[0].id).toBe(results[1].id);
    expect(results.filter((value) => value.initialPassword === null)).toHaveLength(1);
    const original = results.find((value) => value.initialPassword)!;
    expect((await signIn(original.email, original.initialPassword!)).status).toBe(200);
    expect((await createUser(database.pool, command)).initialPassword).toBeNull();
    expect(
      (await admin.query("SELECT id FROM account WHERE user_id=$1", [original.id])).rowCount,
    ).toBe(1);
  });
  it("rolls back the credential and account when creation audit fails", async () => {
    await expect(
      createUser(database.pool, creation(), {
        writeAudit: async () => {
          throw new Error("synthetic audit failure");
        },
      }),
    ).rejects.toThrow("synthetic audit failure");
    expect(
      (await admin.query("SELECT id FROM \"user\" WHERE email='new@example.test'")).rowCount,
    ).toBe(0);
    expect((await admin.query("SELECT id FROM account")).rowCount).toBe(0);
  });
  it("only initializes an active legacy account once, under concurrent requests", async () => {
    const userId = await legacy();
    expect(await hasUserPassword(database.pool, userId)).toBe(false);
    const results = await Promise.allSettled([
      initializeUserPassword(database.pool, { ...context(), userId }),
      initializeUserPassword(database.pool, { ...context(), userId }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected")).toMatchObject({
      reason: { code: "PASSWORD_ALREADY_DEFINED", status: 409 },
    });
    const success = results.find((result) => result.status === "fulfilled")!;
    if (success.status !== "fulfilled") throw new Error("Expected success");
    expect((await signIn("legacy@example.test", success.value.initialPassword)).status).toBe(200);
    expect(await hasUserPassword(database.pool, userId)).toBe(true);
  });
  it("never changes an existing password", async () => {
    const created = await createUser(database.pool, creation());
    await expect(
      initializeUserPassword(database.pool, { ...context(), userId: created.id }),
    ).rejects.toMatchObject({ code: "PASSWORD_ALREADY_DEFINED" });
    expect((await signIn(created.email, created.initialPassword!)).status).toBe(200);
  });
  it("rejects disabled users and targets outside the manager's current authority", async () => {
    const userId = await legacy();
    await admin.query(
      "UPDATE user_access SET permissions=ARRAY['users:create','users:update','roles:grant'] WHERE user_id=$1",
      [actor.userId],
    );
    await expect(
      initializeUserPassword(database.pool, { ...context(), userId }),
    ).rejects.toMatchObject({ status: 403 });
    await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
      actor.userId,
      accessPermissionSchema.options,
    ]);
    await admin.query("UPDATE \"user\" SET status='disabled',deactivated_at=now() WHERE id=$1", [
      userId,
    ]);
    await expect(
      initializeUserPassword(database.pool, { ...context(), userId }),
    ).rejects.toMatchObject({ status: 404 });
    expect(await hasUserPassword(database.pool, userId)).toBe(false);
  });
  it("rejects revoked sessions, revoked authority and self initialization", async () => {
    const userId = await legacy();
    await expect(
      initializeUserPassword(database.pool, { ...context(), userId: actor.userId }),
    ).rejects.toMatchObject({ status: 403 });
    await admin.query(
      "UPDATE user_access SET permissions=ARRAY['news:read','news:write','news:publish'] WHERE user_id=$1",
      [actor.userId],
    );
    await expect(
      initializeUserPassword(database.pool, { ...context(), userId }),
    ).rejects.toMatchObject({ status: 403 });
    await admin.query("UPDATE session SET revoked_at=now() WHERE id=$1", [actor.sessionId]);
    await expect(
      initializeUserPassword(database.pool, { ...context(), userId }),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("rolls back legacy initialization on audit failure", async () => {
    const userId = await legacy();
    await expect(
      initializeUserPassword(database.pool, { ...context(), userId }, async () => {
        throw new Error("synthetic audit failure");
      }),
    ).rejects.toThrow("synthetic audit failure");
    expect(await hasUserPassword(database.pool, userId)).toBe(false);
  });
});
