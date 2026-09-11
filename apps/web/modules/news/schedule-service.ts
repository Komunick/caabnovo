import "server-only";
import { createHash } from "node:crypto";
import type { Payload } from "payload";
import type { PgBoss } from "pg-boss";
import { idSchema, scheduleNewsRequestSchema, type NewsActionJobPayload } from "@caab/contracts";
import { preparePublication } from "@caab/news/publication";
import type { NewsDatabase } from "@caab/news/database";
import { newsTransaction, newsPublishTransaction } from "./payload/transaction";
import { NewsPolicyError } from "./errors";
import type { NewsCommandContext } from "./news-service";
import type { RequestActor } from "../shared/request-context";
import { redriveJobExecution } from "@caab/db/repositories/job-execution";

export const NEWS_ACTION_QUEUE = "news-publication";
export interface NewsActionEnqueuer {
  enqueue(
    db: NewsDatabase,
    payload: NewsActionJobPayload,
    runAt: Date,
    singletonKey?: string,
  ): Promise<void>;
}
export function pgBossNewsActionEnqueuer(boss: PgBoss): NewsActionEnqueuer {
  return {
    enqueue: async (db, payload, runAt, singletonKey = payload.actionId) => {
      const queued = await boss.send(NEWS_ACTION_QUEUE, payload, {
        startAfter: runAt,
        singletonKey,
        db: { executeSql: (text, values) => db.query(text, values) },
      });
      if (!queued) throw new Error("News action could not be queued");
    },
  };
}
function serializeAction(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    newsId: String(row.news_id),
    revision: Number(row.source_revision),
    action: String(row.action),
    channels: row.channels as string[],
    runAt: new Date(String(row.run_at)).toISOString(),
    timezone: String(row.timezone),
    status: String(row.status),
    jobId: String(row.job_id),
    resultRevision: row.result_revision == null ? null : Number(row.result_revision),
    jobStatus: row.job_status ? String(row.job_status) : "queued",
    attemptCount: Number(row.attempt_count ?? 0),
    attemptLimit: Number(row.attempt_limit ?? 5),
    errorCode: row.safe_error_code == null ? null : String(row.safe_error_code),
  };
}
export async function scheduleNews(
  payload: Payload,
  enqueuer: NewsActionEnqueuer,
  context: NewsCommandContext,
  id: string,
  input: unknown,
  now = new Date(),
) {
  idSchema.parse(id);
  const command = scheduleNewsRequestSchema.parse(input);
  if (
    !context.idempotencyKey ||
    context.idempotencyKey.length < 16 ||
    context.idempotencyKey.length > 128
  )
    throw new NewsPolicyError("NEWS_NOT_READY", 422, "Chave de repetição inválida.");
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ id, ...command }))
    .digest("hex");
  return newsPublishTransaction(payload, context.actor, async ({ db, req, lockNews, audit }) => {
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `news:action:${context.actor!.userId}:${context.idempotencyKey}`,
    ]);
    await lockNews(id);
    const previous = (
      await db.query(
        "SELECT * FROM news_action WHERE requested_by=$1::uuid AND idempotency_key=$2",
        [context.actor!.userId, context.idempotencyKey],
      )
    ).rows[0];
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw new NewsPolicyError(
          "NEWS_ACTION_CONFLICT",
          409,
          "A chave foi usada para outra ação.",
        );
      return serializeAction(previous);
    }
    const runAt = new Date(command.runAt);
    if (runAt.getTime() <= now.getTime() || runAt.getTime() > now.getTime() + 365 * 86400000)
      throw new NewsPolicyError(
        "NEWS_NOT_READY",
        422,
        "Escolha um horário futuro dentro de um ano.",
      );
    const current = await payload.findByID({
      collection: "news",
      id,
      req,
      overrideAccess: false,
      draft: true,
      depth: 0,
      disableErrors: true,
    });
    if (!current) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Notícia não encontrada.");
    if (current.archived) throw new NewsPolicyError("NEWS_ARCHIVED", 409, "Notícia arquivada.");
    if (Number(current.revision) !== command.expectedVersion)
      throw new NewsPolicyError("NEWS_VERSION_CONFLICT", 409, "A notícia foi alterada.");
    if (command.action === "publish")
      await preparePublication(db, id, current, context.actor!.userId, {
        expectedVersion: command.expectedVersion,
        channels: command.channels,
      });
    const source =
      command.action === "publish"
        ? current
        : await payload.findByID({
            collection: "news",
            id,
            req,
            overrideAccess: false,
            draft: false,
            depth: 0,
          });
    if (command.action === "unpublish" && source._status !== "published")
      throw new NewsPolicyError("NEWS_NOT_READY", 422, "Publique antes de agendar uma retirada.");
    const sourceRevision = Number(source.revision);
    const version = (
      await db.query(
        "SELECT id FROM _news_v WHERE parent_id=$1::uuid AND version_revision=$2 ORDER BY created_at DESC,id DESC LIMIT 1",
        [id, sourceRevision],
      )
    ).rows[0];
    if (!version) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Revisão não encontrada.");
    const actionId = crypto.randomUUID(),
      jobId = crypto.randomUUID();
    await db.query(
      "INSERT INTO job_execution(id,job_type,queue_name,idempotency_key,correlation_id,request_id,aggregate_type,aggregate_id,attempt_limit) VALUES ($1::uuid,$2,$2,$3,$4::uuid,$5::uuid,'news',$6,5)",
      [jobId, NEWS_ACTION_QUEUE, actionId, context.correlationId, context.requestId, id],
    );
    const row = (
      await db.query(
        `INSERT INTO news_action(id,news_id,version_id,source_revision,action,channels,run_at,timezone,requested_by,idempotency_key,fingerprint,job_id,request_id,correlation_id)
      VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5,$6::jsonb,$7,$8,$9::uuid,$10,$11,$12::uuid,$13::uuid,$14::uuid) RETURNING *`,
        [
          actionId,
          id,
          version.id,
          sourceRevision,
          command.action,
          JSON.stringify(command.channels),
          runAt,
          command.timezone,
          context.actor!.userId,
          context.idempotencyKey,
          fingerprint,
          jobId,
          context.requestId,
          context.correlationId,
        ],
      )
    ).rows[0]!;
    await enqueuer.enqueue(
      db,
      {
        actionId,
        newsId: id,
        jobId,
        requestId: context.requestId,
        correlationId: context.correlationId,
      },
      runAt,
    );
    await audit({
      actorUserId: context.actor!.userId,
      effectiveIdentity: `user:${context.actor!.userId}`,
      action: "news.action.scheduled",
      entityType: "news",
      entityId: id,
      after: {
        actionId,
        revision: sourceRevision,
        action: command.action,
        channels: command.channels,
        runAt: runAt.toISOString(),
      },
      origin: "web",
      requestId: context.requestId,
      correlationId: context.correlationId,
    });
    return serializeAction(row);
  });
}
export async function listNewsActions(
  payload: Payload,
  actor: RequestActor | undefined,
  id: string,
) {
  idSchema.parse(id);
  return newsTransaction(payload, actor, async ({ db }) =>
    (
      await db.query(
        "SELECT a.*, j.status AS job_status,j.attempt_count,j.attempt_limit,j.safe_error_code FROM news_action a JOIN job_execution j ON j.id=a.job_id WHERE a.news_id=$1::uuid ORDER BY a.created_at DESC,a.id DESC LIMIT 100",
        [id],
      )
    ).rows.map(serializeAction),
  );
}
export async function retryNewsAction(
  payload: Payload,
  enqueuer: NewsActionEnqueuer,
  context: NewsCommandContext,
  id: string,
  actionId: string,
) {
  idSchema.parse(id);
  idSchema.parse(actionId);
  return newsPublishTransaction(payload, context.actor, async ({ db, lockNews, audit }) => {
    await lockNews(id);
    const action = (
      await db.query(
        "SELECT * FROM news_action WHERE id=$1::uuid AND news_id=$2::uuid FOR UPDATE",
        [actionId, id],
      )
    ).rows[0];
    if (!action) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Agendamento não encontrado.");
    if (action.status !== "pending")
      throw new NewsPolicyError("NEWS_ACTION_CONFLICT", 409, "A ação já foi encerrada.");
    const job = (
      await db.query("SELECT * FROM job_execution WHERE id=$1::uuid FOR UPDATE", [action.job_id])
    ).rows[0]!;
    if (job.status === "queued" || job.status === "running")
      return { id: actionId, status: String(job.status) };
    if (!(await redriveJobExecution(db, String(action.job_id))))
      throw new NewsPolicyError(
        "NEWS_ACTION_CONFLICT",
        409,
        "Limite de tentativas atingido. Cancele e crie um novo agendamento.",
      );
    await enqueuer.enqueue(
      db,
      {
        actionId,
        newsId: id,
        jobId: String(action.job_id),
        requestId: String(action.request_id),
        correlationId: String(action.correlation_id),
      },
      new Date(),
      `${actionId}:retry:${Number(job.attempt_count) + 1}`,
    );
    await audit({
      actorUserId: context.actor!.userId,
      effectiveIdentity: `user:${context.actor!.userId}`,
      action: "news.action.retried",
      entityType: "news",
      entityId: id,
      after: { actionId, jobId: action.job_id, nextAttempt: Number(job.attempt_count) + 1 },
      origin: "web",
      requestId: context.requestId,
      correlationId: context.correlationId,
    });
    return { id: actionId, status: "queued" };
  });
}
export async function cancelNewsAction(
  payload: Payload,
  context: NewsCommandContext,
  id: string,
  actionId: string,
) {
  idSchema.parse(id);
  idSchema.parse(actionId);
  return newsPublishTransaction(payload, context.actor, async ({ db, lockNews, audit }) => {
    await lockNews(id);
    const row = (
      await db.query(
        "SELECT * FROM news_action WHERE id=$1::uuid AND news_id=$2::uuid FOR UPDATE",
        [actionId, id],
      )
    ).rows[0];
    if (!row) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Agendamento não encontrado.");
    if (row.status === "cancelled") return serializeAction(row);
    if (row.status !== "pending")
      throw new NewsPolicyError("NEWS_ACTION_CONFLICT", 409, "A ação já foi executada.");
    const updated = (
      await db.query(
        "UPDATE news_action SET status='cancelled',completed_at=now(),cancelled_by=$2::uuid WHERE id=$1::uuid RETURNING *",
        [actionId, context.actor!.userId],
      )
    ).rows[0]!;
    await audit({
      actorUserId: context.actor!.userId,
      effectiveIdentity: `user:${context.actor!.userId}`,
      action: "news.action.cancelled",
      entityType: "news",
      entityId: id,
      after: { actionId },
      origin: "web",
      requestId: context.requestId,
      correlationId: context.correlationId,
    });
    return serializeAction(updated);
  });
}
