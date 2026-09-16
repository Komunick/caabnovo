import { createHash, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { withTransaction } from "../client";
import { writeAuditEvent } from "./audit-writer";
import {
  messageDataSchema,
  messageSaveSchema,
  messageCommandSchema,
  messagePreferenceSchema,
  messageQuerySchema,
  messageContentIssues,
  personalizeMessage,
  type MessageKind,
  type MessageData,
  type MessageRecord,
  type MessageAudience,
  type MessagePreview,
  type MessageCounts,
  type MessageExecution,
  type MessagePerson,
} from "@caab/contracts";

export type MessagingActor = { userId: string; sessionId: string };
export type MessagingContext = {
  actor: MessagingActor;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
};
export class MessagingError extends Error {
  constructor(
    readonly code: string,
    readonly status = 409,
  ) {
    super(code);
  }
}
const columns = `(SELECT e.status FROM messaging_execution e WHERE e.campaign_id=r.id ORDER BY e.created_at DESC,e.id LIMIT 1) AS "lastExecutionStatus",r.id,r.kind,r.data,r.version,r.archived_at AS "archivedAt",r.updated_at AS "updatedAt",
 (SELECT e.scheduled_at FROM messaging_execution e WHERE e.campaign_id=r.id AND e.status='scheduled') AS "scheduledAt"`;
const executionColumns = `id,campaign_id AS "campaignId",campaign_version AS "campaignVersion",snapshot,status,reason,
 scheduled_at AS "scheduledAt",created_at AS "createdAt",completed_at AS "completedAt",counts`;

async function authorize(client: PoolClient, actor: MessagingActor) {
  const session = await client.query(
    `SELECT u.id FROM "user" u JOIN session s ON s.user_id=u.id
 WHERE u.id=$1 AND s.id=$2 AND u.status='active' AND s.revoked_at IS NULL
 AND s.expires_at>clock_timestamp() FOR SHARE OF u,s`,
    [actor.userId, actor.sessionId],
  );
  if (!session.rowCount) throw new MessagingError("AUTHENTICATION_REQUIRED", 401);
  const grants = await client.query(
    `SELECT permission FROM effective_user_permission WHERE user_id=$1 AND permission='messages:access'`,
    [actor.userId],
  );
  if (!grants.rowCount) throw new MessagingError("PERMISSION_DENIED", 403);
}
async function read<T>(
  pool: Pool,
  actor: MessagingActor,
  work: (client: PoolClient) => Promise<T>,
) {
  return withTransaction(pool, async (client) => {
    await authorize(client, actor);
    return work(client);
  });
}
async function mutate<T>(
  pool: Pool,
  context: MessagingContext,
  payload: unknown,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  if (context.idempotencyKey.length < 16 || context.idempotencyKey.length > 128)
    throw new MessagingError("IDEMPOTENCY_KEY_REQUIRED", 422);
  return withTransaction(pool, async (client) => {
    // One lock order for commands, preferences and scheduler; retries are atomic with audit.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('caab:messaging'))");
    await authorize(client, context.actor);
    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    const previous = await client.query<{ payload_hash: string; result: T }>(
      "SELECT payload_hash,result FROM messaging_request WHERE actor_id=$1 AND key=$2",
      [context.actor.userId, context.idempotencyKey],
    );
    if (previous.rows[0]) {
      if (previous.rows[0].payload_hash !== hash) throw new MessagingError("IDEMPOTENCY_CONFLICT");
      return previous.rows[0].result;
    }
    const result = await work(client);
    await client.query(
      "INSERT INTO messaging_request(actor_id,key,payload_hash,result) VALUES($1,$2,$3,$4)",
      [context.actor.userId, context.idempotencyKey, hash, JSON.stringify(result)],
    );
    return result;
  });
}
async function audit(
  client: PoolClient,
  context: MessagingContext,
  id: string,
  action: string,
  after: Record<string, unknown>,
) {
  await writeAuditEvent(client, {
    actorUserId: context.actor.userId,
    effectiveIdentity: `user:${context.actor.userId}`,
    action: `message.${action}`,
    entityType: action === "preference.updated" ? "messaging_preference" : "message",
    entityId: id,
    after,
    origin: "web",
    requestId: context.requestId,
    correlationId: context.correlationId,
  });
}
async function record(client: PoolClient, kind: MessageKind, id: string, lock = false) {
  const result = await client.query<MessageRecord>(
    `SELECT ${columns} FROM messaging_resource r WHERE r.id=$1 AND r.kind=$2 ${lock ? "FOR UPDATE OF r" : ""}`,
    [id, kind],
  );
  if (!result.rows[0]) throw new MessagingError("MESSAGE_NOT_FOUND", 404);
  const saved = result.rows[0];
  const ids = [...new Set([...saved.data.audience.memberIds, ...saved.data.audience.excludedIds])];
  saved.people = ids.length
    ? (
        await client.query<{ id: string; name: string }>(
          "SELECT id,COALESCE(NULLIF(social_name,''),name) AS name FROM member WHERE id=ANY($1::uuid[])",
          [ids],
        )
      ).rows
    : [];
  return saved;
}
const pattern = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&")}%`;
export async function listMessages(
  pool: Pool,
  actor: MessagingActor,
  kind: MessageKind,
  raw: unknown,
) {
  const q = messageQuerySchema.parse(raw);
  return read(pool, actor, async (client) => {
    const params = [kind, pattern(q.q), q.archived];
    const where = `r.kind=$1 AND r.data->>'name' ILIKE $2 AND ($3='all' OR ($3='archived')=(r.archived_at IS NOT NULL))`;
    const total = Number(
      (await client.query(`SELECT count(*) FROM messaging_resource r WHERE ${where}`, params))
        .rows[0].count,
    );
    const items = (
      await client.query<MessageRecord>(
        `SELECT ${columns} FROM messaging_resource r WHERE ${where} ORDER BY r.updated_at DESC,r.id LIMIT $4 OFFSET $5`,
        [...params, q.pageSize, (q.page - 1) * q.pageSize],
      )
    ).rows;
    return { items, total, page: q.page, hasNextPage: q.page * q.pageSize < total };
  });
}
export const getMessage = (pool: Pool, actor: MessagingActor, kind: MessageKind, id: string) =>
  read(pool, actor, (c) => record(c, kind, id));

export async function saveMessage(
  pool: Pool,
  context: MessagingContext,
  kind: MessageKind,
  id: string | null,
  raw: unknown,
) {
  const input = messageSaveSchema.parse(raw);
  if ((id === null) !== (input.expectedVersion === 0)) throw new MessagingError("VERSION_CONFLICT");
  return mutate(pool, context, { kind, id, input }, async (client) => {
    await validateAudience(client, input.data.audience);
    if (id) {
      const before = await record(client, kind, id, true);
      if (before.version !== input.expectedVersion) throw new MessagingError("VERSION_CONFLICT");
      if (before.archivedAt || before.scheduledAt) throw new MessagingError("MESSAGE_LOCKED");
      await client.query(
        "UPDATE messaging_resource SET data=$2,version=version+1,updated_at=clock_timestamp() WHERE id=$1",
        [id, input.data],
      );
    } else {
      id = (
        await client.query<{ id: string }>(
          "INSERT INTO messaging_resource(kind,data) VALUES($1,$2) RETURNING id",
          [kind, input.data],
        )
      ).rows[0]!.id;
    }
    const saved = await record(client, kind, id);
    await audit(client, context, id, "saved", { kind, version: saved.version });
    return saved;
  });
}

async function audiencePreview(client: PoolClient, data: MessageData): Promise<MessagePreview> {
  const a = data.audience;
  const selected = await client.query<{
    counts: MessageCounts;
    sample: { id: string; name: string }[];
  }>(
    `
 WITH matched AS (
 SELECT m.id,COALESCE(NULLIF(m.social_name,''),m.name) AS name,
 m.id=ANY($4::uuid[]) AS excluded,COALESCE(s.blocked,false) AS suppressed
 FROM member m LEFT JOIN messaging_suppression s ON s.member_id=m.id
 WHERE m.archived_at IS NULL AND ($1='' OR m.oab_state=$1)
 AND ($2='any' OR ($2='email' AND btrim(m.email)<>'') OR ($2='phone' AND btrim(m.phone)<>''))
 AND (cardinality($3::uuid[])=0 OR m.id=ANY($3::uuid[]))
 ) SELECT jsonb_build_object('matched',count(*),'excluded',count(*) FILTER(WHERE excluded),
 'suppressed',count(*) FILTER(WHERE NOT excluded AND suppressed),'eligible',count(*) FILTER(WHERE NOT excluded AND NOT suppressed)) AS counts,
 COALESCE((SELECT jsonb_agg(v) FROM (SELECT id,name FROM matched WHERE NOT excluded AND NOT suppressed ORDER BY name,id LIMIT 10) v),'[]') AS sample FROM matched`,
    [a.state, a.contact, a.memberIds, a.excludedIds],
  );
  const { counts, sample } = selected.rows[0]!;
  return {
    counts,
    sample,
    subject: personalizeMessage(data.subject, sample[0]?.name ?? "Pessoa de exemplo"),
    body: personalizeMessage(data.body, sample[0]?.name ?? "Pessoa de exemplo"),
    issues: messageContentIssues(data),
    channelConfigured: false,
  };
}
export const previewMessage = (pool: Pool, actor: MessagingActor, data: unknown) =>
  read(pool, actor, (c) => audiencePreview(c, messageDataSchema.parse(data)));
async function validateAudience(client: PoolClient, a: MessageAudience) {
  const ids = [...new Set([...a.memberIds, ...a.excludedIds])];
  if (!ids.length) return;
  const result = await client.query("SELECT id FROM member WHERE id=ANY($1::uuid[])", [ids]);
  if (result.rowCount !== ids.length) throw new MessagingError("INVALID_RECIPIENT", 422);
}
export async function commandMessage(
  pool: Pool,
  context: MessagingContext,
  kind: MessageKind,
  id: string,
  raw: unknown,
) {
  const input = messageCommandSchema.parse(raw);
  return mutate(pool, context, { kind, id, input }, async (client) => {
    const before = await record(client, kind, id, true);
    if (before.version !== input.expectedVersion) throw new MessagingError("VERSION_CONFLICT");
    if (input.action === "duplicate") {
      if (kind !== "campaigns") throw new MessagingError("INVALID_ACTION", 422);
      const copy = (
        await client.query<{ id: string }>(
          "INSERT INTO messaging_resource(kind,data) VALUES('campaigns',$1) RETURNING id",
          [{ ...before.data, name: `Cópia de ${before.data.name}`.slice(0, 160) }],
        )
      ).rows[0]!.id;
      await audit(client, context, copy, "duplicated", { sourceId: id });
      return record(client, kind, copy);
    }
    if (input.action === "restore") {
      if (!before.archivedAt) throw new MessagingError("INVALID_STATE");
      await client.query("UPDATE messaging_resource SET archived_at=NULL WHERE id=$1", [id]);
    } else if (input.action === "archive") {
      if (before.archivedAt || before.scheduledAt) throw new MessagingError("MESSAGE_LOCKED");
      await client.query(
        "UPDATE messaging_resource SET archived_at=clock_timestamp() WHERE id=$1",
        [id],
      );
    } else {
      if (kind !== "campaigns" || before.archivedAt) throw new MessagingError("INVALID_STATE");
      if (input.action === "cancel") {
        const changed = await client.query(
          "UPDATE messaging_execution SET status='canceled',reason='USER_CANCELED',completed_at=clock_timestamp() WHERE campaign_id=$1 AND status='scheduled' RETURNING id",
          [id],
        );
        if (!changed.rowCount) throw new MessagingError("INVALID_STATE");
      } else {
        if (before.scheduledAt) throw new MessagingError("MESSAGE_LOCKED");
        const preview = await audiencePreview(client, before.data);
        if (preview.issues.length) throw new MessagingError("CONTENT_INCOMPLETE", 422);
        await validateAudience(client, before.data.audience);
        const scheduled = input.action === "schedule";
        if (scheduled) {
          const delay = new Date(input.scheduledAt!).getTime() - Date.now();
          if (delay < 60000 || delay > 366 * 86400000)
            throw new MessagingError("INVALID_SCHEDULE", 422);
        }
        await client.query(
          `INSERT INTO messaging_execution(campaign_id,campaign_version,snapshot,requested_by,status,reason,scheduled_at,completed_at,counts)
    VALUES($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz,clock_timestamp()),CASE WHEN $5='scheduled' THEN NULL ELSE clock_timestamp() END,$8)`,
          [
            id,
            before.version,
            before.data,
            context.actor.userId,
            scheduled ? "scheduled" : "blocked",
            scheduled ? null : preview.counts.eligible ? "NO_CHANNEL" : "NO_RECIPIENTS",
            input.scheduledAt ?? null,
            scheduled ? null : preview.counts,
          ],
        );
      }
    }
    await client.query(
      "UPDATE messaging_resource SET version=version+1,updated_at=clock_timestamp() WHERE id=$1",
      [id],
    );
    const saved = await record(client, kind, id);
    await audit(client, context, id, input.action, {
      version: saved.version,
      scheduledAt: input.scheduledAt ?? null,
    });
    return saved;
  });
}
export const messageHistory = (pool: Pool, actor: MessagingActor, id: string, raw: unknown) =>
  read(pool, actor, async (client) => {
    const q = messageQuerySchema.parse(raw);
    await record(client, "campaigns", id);
    const total = Number(
      (await client.query("SELECT count(*) FROM messaging_execution WHERE campaign_id=$1", [id]))
        .rows[0].count,
    );
    const items = (
      await client.query<MessageExecution>(
        `SELECT ${executionColumns} FROM messaging_execution WHERE campaign_id=$1 ORDER BY created_at DESC,id LIMIT $2 OFFSET $3`,
        [id, q.pageSize, (q.page - 1) * q.pageSize],
      )
    ).rows;
    return { items, total, page: q.page, hasNextPage: q.page * q.pageSize < total };
  });
export const messagePeople = (
  pool: Pool,
  actor: MessagingActor,
  raw: unknown,
  preferences = false,
) =>
  read(pool, actor, async (client) => {
    const q = messageQuerySchema.parse(raw);
    const where = `m.archived_at IS NULL AND (m.name ILIKE $1 OR m.social_name ILIKE $1) AND (NOT $2 OR s.blocked=true)`;
    const params = [pattern(q.q), preferences];
    const total = Number(
      (
        await client.query(
          `SELECT count(*) FROM member m LEFT JOIN messaging_suppression s ON s.member_id=m.id WHERE ${where}`,
          params,
        )
      ).rows[0].count,
    );
    const items = (
      await client.query<MessagePerson>(
        `SELECT m.id,COALESCE(NULLIF(m.social_name,''),m.name) AS name,COALESCE(s.blocked,false) AS blocked,COALESCE(s.version,0) AS version,COALESCE(s.reason,'') AS reason FROM member m LEFT JOIN messaging_suppression s ON s.member_id=m.id WHERE ${where} ORDER BY m.name,m.id LIMIT $3 OFFSET $4`,
        [...params, q.pageSize, (q.page - 1) * q.pageSize],
      )
    ).rows;
    return { items, total, page: q.page, hasNextPage: q.page * q.pageSize < total };
  });
export async function saveMessagePreference(
  pool: Pool,
  context: MessagingContext,
  id: string,
  raw: unknown,
) {
  const input = messagePreferenceSchema.parse(raw);
  return mutate(pool, context, { preference: id, input }, async (client) => {
    const member = await client.query("SELECT id FROM member WHERE id=$1 AND archived_at IS NULL", [
      id,
    ]);
    if (!member.rowCount) throw new MessagingError("INVALID_RECIPIENT", 404);
    const before = await client.query<{ version: number }>(
      "SELECT version FROM messaging_suppression WHERE member_id=$1",
      [id],
    );
    if ((before.rows[0]?.version ?? 0) !== input.expectedVersion)
      throw new MessagingError("VERSION_CONFLICT");
    const result = await client.query<{ version: number }>(
      `INSERT INTO messaging_suppression(member_id,blocked,reason,updated_by) VALUES($1,$2,$3,$4)
 ON CONFLICT(member_id) DO UPDATE SET blocked=EXCLUDED.blocked,reason=EXCLUDED.reason,updated_by=EXCLUDED.updated_by,version=messaging_suppression.version+1,updated_at=clock_timestamp() RETURNING version`,
      [id, input.blocked, input.reason, context.actor.userId],
    );
    await audit(client, context, id, "preference.updated", {
      blocked: input.blocked,
      version: result.rows[0]!.version,
    });
    return { ...input, version: result.rows[0]!.version };
  });
}
/** No transport here. A future provider must never automatically release blocked executions. */
export async function processScheduledMessages(pool: Pool, limit = 25) {
  return withTransaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('caab:messaging'))");
    const due = await client.query<{
      id: string;
      campaign_id: string;
      requested_by: string;
      snapshot: MessageData;
    }>(
      "SELECT id,campaign_id,requested_by,snapshot FROM messaging_execution WHERE status='scheduled' AND scheduled_at<=clock_timestamp() ORDER BY scheduled_at,id LIMIT $1 FOR UPDATE SKIP LOCKED",
      [limit],
    );
    for (const job of due.rows) {
      const user = await client.query(
        `SELECT id FROM "user" WHERE id=$1 AND status='active' FOR SHARE`,
        [job.requested_by],
      );
      const grants = await client.query(
        "SELECT permission FROM effective_user_permission WHERE user_id=$1 AND permission='messages:access'",
        [job.requested_by],
      );
      const allowed = Boolean(user.rowCount && grants.rowCount);
      const preview = allowed
        ? await audiencePreview(client, messageDataSchema.parse(job.snapshot))
        : null;
      const reason = !allowed
        ? "ACCESS_REVOKED"
        : preview!.counts.eligible
          ? "NO_CHANNEL"
          : "NO_RECIPIENTS";
      await client.query(
        "UPDATE messaging_execution SET status=$2,reason=$3,completed_at=clock_timestamp(),counts=$4 WHERE id=$1",
        [job.id, allowed ? "blocked" : "canceled", reason, preview?.counts ?? null],
      );
      await client.query(
        "UPDATE messaging_resource SET version=version+1,updated_at=clock_timestamp() WHERE id=$1",
        [job.campaign_id],
      );
      await writeAuditEvent(client, {
        actorUserId: job.requested_by,
        effectiveIdentity: "worker:messaging",
        action: "message.execution.completed",
        entityType: "message",
        entityId: job.campaign_id,
        after: { executionId: job.id, reason, counts: preview?.counts ?? null },
        origin: "worker",
        requestId: randomUUID(),
        correlationId: job.id,
      });
    }
    return due.rowCount ?? 0;
  });
}
