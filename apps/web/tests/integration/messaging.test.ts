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
  listMessageSchedules,
  messageAudienceOptions,
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
    ).rejects.toMatchObject({ code: "55000" });
    await expect(
      pool.query("UPDATE messaging_execution SET counts='{}' WHERE id=$1", [execution.id]),
    ).rejects.toMatchObject({ code: "55000" });
  });
});

it("combines demographic filters, exact ages, current relationships and explicit administrative statuses", async () => {
  const ids = (
    await admin.query<{
      id: string;
    }>(`INSERT INTO member(name,category,gender,city,residence_state,birth_date)
 SELECT 'Segmentação sintética '||i,'Categoria sintética','female','Salvador','BA',
 CASE WHEN i=5 THEN NULL WHEN i=4 THEN ((clock_timestamp() AT TIME ZONE 'America/Bahia')::date-interval '30 years'+interval '1 day')::date
 ELSE ((clock_timestamp() AT TIME ZONE 'America/Bahia')::date-interval '30 years')::date END FROM generate_series(1,6)i RETURNING id`)
  ).rows.map((p) => p.id);
  await admin.query("UPDATE member SET gender='male' WHERE id=$1", [ids[2]]);
  await admin.query(
    "UPDATE member SET administrative_status='active',administrative_reason='Teste',administrative_changed_at=now(),administrative_changed_by=$2 WHERE id=$1",
    [ids[0], base.actor.userId],
  );
  await admin.query(
    "INSERT INTO member_relationship(holder_id,dependent_id,relationship,starts_on,created_by) VALUES($1,$2,'Teste',current_date,$3),($4,$2,'Teste',current_date,$3)",
    [ids[0], ids[1], base.actor.userId, ids[2]],
  );
  await admin.query(
    "INSERT INTO member_relationship(holder_id,dependent_id,relationship,starts_on,ended_at,created_by) VALUES($1,$2,'Encerrado',current_date,now(),$3)",
    [ids[0], ids[5], base.actor.userId],
  );
  const audience = {
    category: "categoria sintética",
    gender: "female",
    city: "salvador",
    residenceState: "BA",
    minAge: 30,
    maxAge: 30,
  };
  const preview = async (extra = {}) =>
    previewMessage(pool, base.actor, { ...data(), audience: { ...audience, ...extra } });
  expect((await preview()).counts.matched).toBe(3);
  expect((await preview({ relationship: "dependent" })).counts.matched).toBe(1); // two holders never duplicate a person
  expect((await preview({ relationship: "holder" })).counts.matched).toBe(2); // ended relationship is not dependency
  expect((await preview({ administrativeStatus: "active" })).counts.matched).toBe(1);
  expect((await preview({ administrativeStatus: "inactive" })).counts.matched).toBe(2);
  expect((await preview({ state: "BA" })).counts.matched).toBe(0); // residence is not OAB
  expect((await preview({ minAge: 29, maxAge: 29 })).counts.matched).toBe(1);
  const options = await messageAudienceOptions(pool, base.actor, "category", {
    q: "Categoria sintética",
  });
  expect(options.items).toEqual([{ name: "Categoria sintética" }]);
  await admin.query("UPDATE member SET archived_at=now() WHERE id=$1", [ids[5]]);
  expect((await preview()).counts.matched).toBe(2);
});
it("lists, reschedules atomically, preserves snapshots and rejects stale or invalid changes", async () => {
  const campaign = await create();
  const first = await command(campaign, "schedule", {
    scheduledAt: new Date(Date.now() + 2 * 861000).toISOString(),
  });
  const original = (await history(campaign.id)).items[0]!;
  await expect(
    command(first, "reschedule", { scheduledAt: new Date(Date.now() - 60000).toISOString() }),
  ).rejects.toMatchObject({ code: "INVALID_SCHEDULE" });
  expect((await history(campaign.id)).items[0]!.status).toBe("scheduled");
  const second = await command(first, "reschedule", {
    scheduledAt: new Date(Date.now() + 3 * 861000).toISOString(),
  });
  const timeline = (await history(campaign.id)).items;
  expect(timeline).toHaveLength(2);
  expect(timeline.find((item) => item.id === original.id)).toMatchObject({
    status: "canceled",
    reason: "RESCHEDULED",
    snapshot: original.snapshot,
  });
  const list = await listMessageSchedules(pool, base.actor, {
    status: "scheduled",
    q: campaign.data.name,
  });
  expect(list.items.find((item) => item.campaignId === campaign.id)).toMatchObject({
    currentVersion: second.version,
    status: "scheduled",
  });
  expect(list.items.every((item) => !("snapshot" in item))).toBe(true);
  await expect(command(first, "cancel")).rejects.toMatchObject({ code: "VERSION_CONFLICT" });
  await command(second, "cancel");
  expect(
    (await listMessageSchedules(pool, base.actor, { status: "scheduled" })).items.some(
      (item) => item.campaignId === campaign.id,
    ),
  ).toBe(false);
});
it("counts and saves a 100-person audience without truncation, including execution-time exclusions", async () => {
  const ids = (
    await admin.query<{ id: string }>(
      `INSERT INTO member(name,category) SELECT 'Escala sintética '||i,'Teste escala 100' FROM generate_series(1,100)i RETURNING id`,
    )
  ).rows.map((p) => p.id);
  const broad = { ...data(), audience: { category: "Teste escala 100" } };
  const preview = await previewMessage(pool, base.actor, broad);
  expect(preview.counts).toEqual({ matched: 100, excluded: 0, suppressed: 0, eligible: 100 });
  expect(preview.sample).toHaveLength(10);
  const explicit = await saveMessage(pool, next(), "audiences", null, {
    expectedVersion: 0,
    data: { ...broad, audience: { memberIds: ids, excludedIds: [] } },
  });
  expect(explicit.data.audience.memberIds).toHaveLength(100);
  const allExcluded = await previewMessage(pool, base.actor, {
    ...broad,
    audience: { category: "Teste escala 100", excludedIds: ids },
  });
  expect(allExcluded.counts.excluded).toBe(100);
  const campaign = await saveMessage(pool, next(), "campaigns", null, {
    expectedVersion: 0,
    data: { ...broad, audience: { category: "Teste escala 100", excludedIds: [ids[2]] } },
  });
  const scheduled = await command(campaign, "schedule", {
    scheduledAt: new Date(Date.now() + 861000).toISOString(),
  });
  await admin.query("UPDATE member SET archived_at=now() WHERE id=$1", [ids[0]]);
  await saveMessagePreference(pool, next(), ids[1]!, {
    blocked: true,
    reason: "Teste escala",
    expectedVersion: 0,
  });
  await admin.query(
    "UPDATE messaging_execution SET scheduled_at=now()-interval '1 minute' WHERE campaign_id=$1",
    [scheduled.id],
  );
  await processScheduledMessages(pool);
  const completed = (await history(campaign.id)).items[0]!;
  expect(completed).toMatchObject({
    status: "blocked",
    reason: "NO_CHANNEL",
    counts: { matched: 99, excluded: 1, suppressed: 1, eligible: 97 },
  });
}, 60000);
