import "server-only";
import type { Pool, PoolClient } from "pg";
import type { Db, PgBoss } from "pg-boss";
import type {
  AuditExportJobPayload,
  FileScanJobPayload,
  NewsActionJobPayload,
  Job,
} from "@caab/contracts";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { findJobExecution, redriveJobExecution } from "@caab/db/repositories/job-execution";
import { requirePermission } from "../auth/authorize";
import { PERMISSIONS } from "../auth/permissions";
import type { RequestActor } from "../shared/request-context";

export async function findAuthorizedJob(
  pool: Pool,
  actor: RequestActor,
  jobId: string,
): Promise<Job | null> {
  requirePermission(actor, PERMISSIONS.jobsRead);
  const job = await findJobExecution(pool, jobId);
  return job
    ? {
        id: job.id,
        jobType: job.jobType,
        status: job.status,
        progress: job.progress,
        attemptCount: job.attemptCount,
        safeErrorCode: job.safeErrorCode,
        safeErrorMessage: job.safeErrorMessage,
        createdAt: job.createdAt.toISOString(),
        finishedAt: job.finishedAt?.toISOString() ?? null,
        correlationId: job.correlationId,
      }
    : null;
}

export async function listAuthorizedJobs(
  pool: Pool,
  actor: RequestActor,
  limit = 100,
): Promise<Job[]> {
  requirePermission(actor, PERMISSIONS.jobsRead);
  const result = await pool.query<{
    id: string;
    job_type: string;
    status: Job["status"];
    progress: number;
    attempt_count: number;
    safe_error_code: string | null;
    safe_error_message: string | null;
    created_at: Date;
    finished_at: Date | null;
    correlation_id: string;
  }>(
    `SELECT id, job_type, status, progress, attempt_count, safe_error_code,
      safe_error_message, created_at, finished_at, correlation_id
     FROM job_execution ORDER BY created_at DESC LIMIT $1`,
    [Math.max(1, Math.min(100, Math.trunc(limit)))],
  );
  return result.rows.map((job) => ({
    id: job.id,
    jobType: job.job_type,
    status: job.status,
    progress: job.progress,
    attemptCount: job.attempt_count,
    safeErrorCode: job.safe_error_code,
    safeErrorMessage: job.safe_error_message,
    createdAt: job.created_at.toISOString(),
    finishedAt: job.finished_at?.toISOString() ?? null,
    correlationId: job.correlation_id,
  }));
}

export interface RedriveEnqueuer {
  enqueue(client: PoolClient, queue: string, payload: object, singletonKey: string): Promise<void>;
}

function transactionDatabase(client: PoolClient): Db {
  return { executeSql: (text, values) => client.query(text, values) };
}

export function pgBossRedriveEnqueuer(boss: PgBoss): RedriveEnqueuer {
  return {
    enqueue: async (client, queue, payload, singletonKey) => {
      const queued = await boss.send(queue, payload, {
        db: transactionDatabase(client),
        singletonKey,
      });
      if (!queued) throw new Error("Redrive could not be queued");
    },
  };
}

export async function redriveJob(
  pool: Pool,
  actor: RequestActor,
  input: {
    jobId: string;
    reason: string;
    requestId: string;
    correlationId: string;
    effectiveIdentity: string;
  },
  enqueuer: RedriveEnqueuer,
): Promise<Job> {
  requirePermission(actor, PERMISSIONS.jobsRedrive);
  await withTransaction(pool, async (client) => {
    const result = await client.query<{
      id: string;
      job_type: string;
      queue_name: string;
      correlation_id: string;
      request_id: string | null;
      aggregate_id: string | null;
      attempt_count: number;
    }>(
      `SELECT id, job_type, queue_name, correlation_id, request_id, aggregate_id, attempt_count
       FROM job_execution WHERE id = $1 FOR UPDATE`,
      [input.jobId],
    );
    const job = result.rows[0];
    if (!job) throw operationError("NOT_FOUND", 404);
    const payload = await rebuildPayload(client, job);
    if (!(await redriveJobExecution(client, job.id))) throw operationError("REDRIVE_DENIED", 409);
    await enqueuer.enqueue(
      client,
      job.queue_name,
      payload,
      `${job.id}:redrive:${job.attempt_count + 1}`,
    );
    await writeAuditEvent(client, {
      actorUserId: actor.userId,
      effectiveIdentity: input.effectiveIdentity,
      action: "job.redriven",
      entityType: "job_execution",
      entityId: job.id,
      before: { status: "failed", attemptCount: job.attempt_count },
      after: { status: "queued", nextAttempt: job.attempt_count + 1 },
      reason: input.reason,
      origin: "web",
      requestId: input.requestId,
      correlationId: input.correlationId,
    });
  });
  const updated = await findAuthorizedJob(pool, actor, input.jobId);
  if (!updated) throw operationError("NOT_FOUND", 404);
  return updated;
}

async function rebuildPayload(
  client: PoolClient,
  job: {
    id: string;
    job_type: string;
    correlation_id: string;
    request_id: string | null;
    aggregate_id: string | null;
  },
): Promise<FileScanJobPayload | AuditExportJobPayload | NewsActionJobPayload> {
  if (!job.request_id) throw operationError("REDRIVE_PAYLOAD_UNAVAILABLE", 409);
  if (job.job_type === "news-publication" && job.aggregate_id) {
    const action = (
      await client.query<{ id: string }>(
        "SELECT id FROM news_action WHERE job_id=$1::uuid AND news_id=$2::uuid AND status='pending'",
        [job.id, job.aggregate_id],
      )
    ).rows[0];
    if (!action) throw operationError("REDRIVE_PAYLOAD_UNAVAILABLE", 409);
    return {
      jobId: job.id,
      actionId: action.id,
      newsId: job.aggregate_id,
      requestId: job.request_id,
      correlationId: job.correlation_id,
    };
  }
  if (job.job_type === "file-scan" && job.aggregate_id) {
    return {
      schemaVersion: 1,
      jobId: job.id,
      fileId: job.aggregate_id,
      correlationId: job.correlation_id,
      requestId: job.request_id,
    };
  }
  if (job.job_type === "audit-export") {
    const audit = await client.query<{
      actor_user_id: string;
      after: {
        from?: string;
        to?: string;
        actorId?: string | null;
        action?: string | null;
        entityType?: string | null;
      };
    }>(
      `SELECT actor_user_id, after FROM audit_event
       WHERE action = 'audit.export.requested' AND entity_id = $1
       ORDER BY occurred_at DESC LIMIT 1`,
      [job.id],
    );
    const source = audit.rows[0];
    if (!source?.actor_user_id || !source.after.from || !source.after.to) {
      throw operationError("REDRIVE_PAYLOAD_UNAVAILABLE", 409);
    }
    return {
      schemaVersion: 1,
      jobId: job.id,
      correlationId: job.correlation_id,
      requestId: job.request_id,
      requestedBy: source.actor_user_id,
      from: source.after.from,
      to: source.after.to,
      ...(source.after.actorId ? { actorId: source.after.actorId } : {}),
      ...(source.after.action ? { action: source.after.action } : {}),
      ...(source.after.entityType ? { entityType: source.after.entityType } : {}),
    };
  }
  throw operationError("REDRIVE_PAYLOAD_UNAVAILABLE", 409);
}

function operationError(code: string, status: number): Error {
  return Object.assign(new Error(code), { code, status });
}
