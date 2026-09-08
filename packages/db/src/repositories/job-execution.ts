import type { Pool, PoolClient } from "pg";

type Queryable = Pick<Pool | PoolClient, "query">;

export interface NewJobExecution {
  id: string;
  jobType: string;
  queueName: string;
  idempotencyKey: string;
  correlationId: string;
  requestId?: string;
  aggregateType?: string;
  aggregateId?: string;
  attemptLimit: number;
}

export async function createJobExecution(
  db: Queryable,
  job: NewJobExecution,
): Promise<{ id: string; created: boolean }> {
  const inserted = await db.query<{ id: string }>(
    `INSERT INTO job_execution (
      id, job_type, queue_name, idempotency_key, correlation_id, request_id,
      aggregate_type, aggregate_id, attempt_limit
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (job_type, idempotency_key) DO NOTHING RETURNING id`,
    [
      job.id,
      job.jobType,
      job.queueName,
      job.idempotencyKey,
      job.correlationId,
      job.requestId ?? null,
      job.aggregateType ?? null,
      job.aggregateId ?? null,
      job.attemptLimit,
    ],
  );
  if (inserted.rows[0]) return { id: inserted.rows[0].id, created: true };
  const existing = await db.query<{ id: string }>(
    "SELECT id FROM job_execution WHERE job_type = $1 AND idempotency_key = $2",
    [job.jobType, job.idempotencyKey],
  );
  const row = existing.rows[0];
  if (!row) throw new Error("Idempotent job lookup failed");
  return { id: row.id, created: false };
}

export async function markJobRunning(db: Queryable, id: string): Promise<void> {
  await db.query(
    `UPDATE job_execution SET status = 'running', started_at = COALESCE(started_at, now()),
      heartbeat_at = now(), attempt_count = attempt_count + 1 WHERE id = $1 AND status IN ('queued', 'running')`,
    [id],
  );
}

export async function updateJobProgress(
  db: Queryable,
  id: string,
  progress: number,
): Promise<void> {
  await db.query(
    "UPDATE job_execution SET progress = GREATEST(progress, $2), heartbeat_at = now() WHERE id = $1 AND status = 'running'",
    [id, Math.max(0, Math.min(100, Math.trunc(progress)))],
  );
}

export async function markJobSucceeded(db: Queryable, id: string): Promise<void> {
  await db.query(
    "UPDATE job_execution SET status = 'succeeded', progress = 100, finished_at = now(), heartbeat_at = now() WHERE id = $1 AND status = 'running'",
    [id],
  );
}

export async function markJobFailed(
  db: Queryable,
  id: string,
  code: string,
  safeMessage: string,
): Promise<void> {
  await db.query(
    `UPDATE job_execution SET status = 'failed', finished_at = now(), heartbeat_at = now(),
      safe_error_code = $2, safe_error_message = $3 WHERE id = $1 AND status = 'running'`,
    [id, code, safeMessage],
  );
}
