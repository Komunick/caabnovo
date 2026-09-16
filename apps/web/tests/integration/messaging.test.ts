import { Client, Pool } from "pg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { messageDataSchema, type MessageRecord } from "@caab/contracts";
import {
  saveMessage,
  getMessage,
  listMessages,
  commandMessage,
  previewMessage,
  messageHistory,
  messagePeople,
  saveMessagePreference,
  processScheduledMessages,
  type MessagingContext,
} from "@caab/db/repositories/messaging";
let container: StartedPostgreSqlContainer;
let admin: Client;
let pool: Pool;
let base: MessagingContext;
let people: string[];
const next = () => ({
  ...base,
  idempotencyKey: crypto.randomUUID(),
  requestId: crypto.randomUUID(),
});
const data = () =>
  messageDataSchema.parse({
    name: "Campanha sintética",
    subject: "Olá {{primeiro_nome}}",
    body: "Mensagem para {{nome}}",
    audience: { memberIds: people },
  });
const create = () =>
  saveMessage(pool, next(), "campaigns", null, { expectedVersion: 0, data: data() });
const command = (record: MessageRecord, action: string, extra = {}) =>
  commandMessage(pool, next(), "campaigns", record.id, {
    action,
    expectedVersion: record.version,
    ...extra,
  });
const history = (id: string) => messageHistory(pool, base.actor, id, {});
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const userId = (
    await admin.query<{ id: string }>(
      `INSERT INTO "user"(name,email) VALUES('Mensagens sintéticas','messages@example.test') RETURNING id`,
    )
  ).rows[0]!.id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
  await admin.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['messages:access'],$1)",
    [userId],
  );
  base = {
    actor: { userId, sessionId },
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    idempotencyKey: crypto.randomUUID(),
  };
  people = (
    await admin.query<{ id: string }>(
      `INSERT INTO member(name,email,phone,oab_number,oab_state,oab_type) VALUES ('Ana Sintética','ana@example.test','','1','BA','lawyer'),('Bruna Sintética','','12345678901','2','SP','lawyer'),('Carla Sintética','carla@example.test','','3','BA','lawyer') RETURNING id`,
    )
  ).rows.map((v) => v.id);
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString() });
}, 120000);
afterAll(async () => {
  await pool?.end();
  await admin?.end();
  await container?.stop();
});
describe("messages lifecycle with the restricted database role", () => {
  it("module-only access creates campaign, model and audience without publishing grants", async () => {
    for (const kind of ["campaigns", "templates", "audiences"] as const) {
      const saved = await saveMessage(pool, next(), kind, null, {
        expectedVersion: 0,
        data: data(),
      });
      expect((await getMessage(pool, base.actor, kind, saved.id)).data.name).toBe(data().name);
    }
  });
  it("concurrent retries create one campaign and different payloads cannot reuse its key", async () => {
    const context = next();
    const input = { expectedVersion: 0, data: data() };
    const results = await Promise.all([
      saveMessage(pool, context, "campaigns", null, input),
      saveMessage(pool, context, "campaigns", null, input),
    ]);
    expect(results[0].id).toBe(results[1].id);
    await expect(
      saveMessage(pool, context, "campaigns", null, {
        ...input,
        data: { ...input.data, name: "Outro nome" },
      }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });
  it("optimistic versions preserve a concurrent edit", async () => {
    const saved = await create();
    const updated = await saveMessage(pool, next(), "campaigns", saved.id, {
      expectedVersion: saved.version,
      data: { ...saved.data, subject: "Alterado" },
    });
    await expect(
      saveMessage(pool, next(), "campaigns", saved.id, {
        expectedVersion: saved.version,
        data: saved.data,
      }),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT" });
    expect(updated.version).toBe(saved.version + 1);
  });
  it("previews minimal names, filters, exclusions and global suppression without conflating counts", async () => {
    await saveMessagePreference(pool, next(), people[2]!, {
      blocked: true,
      reason: "Pedido sintético",
      expectedVersion: 0,
    });
    const preview = await previewMessage(pool, base.actor, {
      ...data(),
      audience: { ...data().audience, excludedIds: [people[1]!] },
    });
    expect(preview.counts).toEqual({ matched: 3, excluded: 1, suppressed: 1, eligible: 1 });
    expect(preview.subject).toBe("Olá Ana");
    expect(Object.keys(preview.sample[0]!).sort()).toEqual(["id", "name"]);
    expect(preview.channelConfigured).toBe(false);
    const filtered = await previewMessage(pool, base.actor, {
      ...data(),
      audience: { ...data().audience, state: "BA", contact: "email" },
    });
    expect(filtered.counts.matched).toBe(2);
    await saveMessagePreference(pool, next(), people[2]!, {
      blocked: false,
      reason: "Revisão sintética",
      expectedVersion: 1,
    });
  });
  it("rejects stale preference changes and exposes no contact or document in recipient search", async () => {
    await expect(
      saveMessagePreference(pool, next(), people[2]!, {
        blocked: true,
        reason: "Teste",
        expectedVersion: 0,
      }),
    ).rejects.toMatchObject({ code: "VERSION_CONFLICT" });
    const found = await messagePeople(pool, base.actor, { q: "Ana Sintética" });
    expect(found.items[0]!.name).toBe("Ana Sintética");
    expect(Object.keys(found.items[0]!).sort()).toEqual([
      "blocked",
      "id",
      "name",
      "reason",
      "version",
    ]);
  });
  it("records one blocked execution for concurrent retries and never reports sent", async () => {
    const saved = await create();
    const ctx = next(),
      input = { action: "send", expectedVersion: saved.version };
    await Promise.all([
      commandMessage(pool, ctx, "campaigns", saved.id, input),
      commandMessage(pool, ctx, "campaigns", saved.id, input),
    ]);
    const result = await history(saved.id);
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      status: "blocked",
      reason: "NO_CHANNEL",
      campaignVersion: saved.version,
    });
    expect(result.items[0]!.counts!.eligible).toBe(3);
  });
  it("does not schedule or send incomplete content", async () => {
    const saved = await saveMessage(pool, next(), "campaigns", null, {
      expectedVersion: 0,
      data: { name: "Incompleto" },
    });
    await expect(command(saved, "send")).rejects.toMatchObject({ code: "CONTENT_INCOMPLETE" });
    expect((await history(saved.id)).total).toBe(0);
  });
  it("scheduled campaigns lock edits and cancellation reopens them", async () => {
    const saved = await create();
    const scheduled = await command(saved, "schedule", {
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    });
    await expect(
      saveMessage(pool, next(), "campaigns", saved.id, {
        expectedVersion: scheduled.version,
        data: saved.data,
      }),
    ).rejects.toMatchObject({ code: "MESSAGE_LOCKED" });
    await expect(command(scheduled, "archive")).rejects.toMatchObject({ code: "MESSAGE_LOCKED" });
    const canceled = await command(scheduled, "cancel");
    expect(canceled.scheduledAt).toBeNull();
    expect((await history(saved.id)).items[0]).toMatchObject({
      status: "canceled",
      reason: "USER_CANCELED",
    });
    expect(
      (
        await saveMessage(pool, next(), "campaigns", saved.id, {
          expectedVersion: canceled.version,
          data: saved.data,
        })
      ).version,
    ).toBe(canceled.version + 1);
  });
  it("workers revalidate suppressions and member archives at the due time with no duplicates", async () => {
    const saved = await create();
    await command(saved, "schedule", { scheduledAt: new Date(Date.now() + 3600000).toISOString() });
    await admin.query(
      "UPDATE messaging_execution SET scheduled_at=now()-interval '1 minute' WHERE campaign_id=$1",
      [saved.id],
    );
    await admin.query("UPDATE member SET archived_at=now() WHERE id=$1", [people[1]]);
    await saveMessagePreference(pool, next(), people[2]!, {
      blocked: true,
      reason: "Antes do horário",
      expectedVersion: 2,
    });
    const processed = await Promise.all([
      processScheduledMessages(pool),
      processScheduledMessages(pool),
    ]);
    expect(processed.reduce((a, b) => a + b, 0)).toBe(1);
    const item = (await history(saved.id)).items[0]!;
    expect(item).toMatchObject({
      status: "blocked",
      reason: "NO_CHANNEL",
      counts: { matched: 2, eligible: 1, suppressed: 1 },
    });
    expect(await processScheduledMessages(pool)).toBe(0);
    await admin.query("UPDATE member SET archived_at=NULL WHERE id=$1", [people[1]]);
    await saveMessagePreference(pool, next(), people[2]!, {
      blocked: false,
      reason: "Fim do teste",
      expectedVersion: 3,
    });
  });
  it("records empty audiences as a distinct blocking reason", async () => {
    const saved = await saveMessage(pool, next(), "campaigns", null, {
      expectedVersion: 0,
      data: { ...data(), audience: { ...data().audience, excludedIds: people } },
    });
    await command(saved, "send");
    expect((await history(saved.id)).items[0]).toMatchObject({
      status: "blocked",
      reason: "NO_RECIPIENTS",
    });
  });
  it("archive and restore preserve history; duplicating creates a separate draft", async () => {
    let saved = await create();
    saved = await command(saved, "send");
    saved = await command(saved, "archive");
    expect(saved.archivedAt).not.toBeNull();
    const copy = await command(saved, "duplicate");
    expect(copy.id).not.toBe(saved.id);
    expect(copy.archivedAt).toBeNull();
    expect((await history(copy.id)).total).toBe(0);
    saved = await command(saved, "restore");
    expect(saved.archivedAt).toBeNull();
    expect((await history(saved.id)).total).toBe(1);
  });
  it("rejects revoked access even for idempotent replay and cancels due work", async () => {
    const ctx = next(),
      input = { expectedVersion: 0, data: data() };
    const saved = await saveMessage(pool, ctx, "campaigns", null, input);
    await command(saved, "schedule", { scheduledAt: new Date(Date.now() + 3600000).toISOString() });
    await admin.query(
      "UPDATE messaging_execution SET scheduled_at=now()-interval '1 minute' WHERE campaign_id=$1",
      [saved.id],
    );
    await admin.query("UPDATE user_access SET permissions='{}' WHERE user_id=$1", [
      base.actor.userId,
    ]);
    try {
      await expect(saveMessage(pool, ctx, "campaigns", null, input)).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
      });
      await expect(listMessages(pool, base.actor, "campaigns", {})).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
      });
      expect(await processScheduledMessages(pool)).toBe(1);
    } finally {
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['messages:access'] WHERE user_id=$1",
        [base.actor.userId],
      );
    }
    expect((await history(saved.id)).items[0]).toMatchObject({
      status: "canceled",
      reason: "ACCESS_REVOKED",
    });
  });
  it("invalid sessions and nonexistent recipients fail closed", async () => {
    await expect(
      getMessage(
        pool,
        { ...base.actor, sessionId: crypto.randomUUID() },
        "campaigns",
        crypto.randomUUID(),
      ),
    ).rejects.toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
    await expect(
      saveMessage(pool, next(), "campaigns", null, {
        expectedVersion: 0,
        data: { ...data(), audience: { memberIds: [crypto.randomUUID()] } },
      }),
    ).rejects.toMatchObject({ code: "INVALID_RECIPIENT" });
  });
  it("rolls back creation if its mandatory audit cannot be written", async () => {
    await admin.query(
      `CREATE FUNCTION reject_message_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='message.saved' THEN RAISE EXCEPTION 'synthetic audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_message_audit BEFORE INSERT ON audit_event FOR EACH ROW EXECUTE FUNCTION reject_message_audit()`,
    );
    const before = Number(
      (await admin.query("SELECT count(*) FROM messaging_resource")).rows[0].count,
    );
    try {
      await expect(create()).rejects.toThrow("synthetic audit failure");
      expect(
        Number((await admin.query("SELECT count(*) FROM messaging_resource")).rows[0].count),
      ).toBe(before);
    } finally {
      await admin.query(
        "DROP TRIGGER reject_message_audit ON audit_event; DROP FUNCTION reject_message_audit()",
      );
    }
  });
  it("runtime cannot rewrite historical snapshots or create fictional sent status", async () => {
    const saved = await create();
    await command(saved, "send");
    const execution = (await history(saved.id)).items[0]!;
    await expect(
      pool.query("UPDATE messaging_execution SET snapshot='{}' WHERE id=$1", [execution.id]),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      pool.query("UPDATE messaging_execution SET status='sent' WHERE id=$1", [execution.id]),
    ).rejects.toMatchObject({ code: "23514" });
  });
});
