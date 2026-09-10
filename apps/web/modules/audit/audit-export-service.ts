import "server-only";
import { createHash } from "node:crypto";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createStorageClient } from "../shared/storage-client";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Pool, PoolClient } from "pg";
import type { Db, PgBoss } from "pg-boss";
import { loadServerEnv } from "@caab/config";
import type { AuditExportJobPayload, AuditExportRequest } from "@caab/contracts";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { createJobExecution } from "@caab/db/repositories/job-execution";
import { requirePermission } from "../auth/authorize";
import { PERMISSIONS } from "../auth/permissions";
import type { RequestActor } from "../shared/request-context";
import { AUDIT_EXPORT_QUEUE } from "../jobs/queue";

interface AuditExportCommand extends AuditExportRequest {
  actor: RequestActor;
  effectiveIdentity: string;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
}

export interface AuditExportEnqueuer {
  enqueue(client: PoolClient, payload: AuditExportJobPayload): Promise<void>;
}

function fingerprint(command: AuditExportRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        from: command.from,
        to: command.to,
        actorId: command.actorId ?? null,
        action: command.action ?? null,
        entityType: command.entityType ?? null,
      }),
    )
    .digest("hex");
}

function transactionDatabase(client: PoolClient): Db {
  return { executeSql: (text, values) => client.query(text, values) };
}

export function pgBossAuditExportEnqueuer(boss: PgBoss): AuditExportEnqueuer {
  return {
    enqueue: async (client, payload) => {
      const queuedId = await boss.send(AUDIT_EXPORT_QUEUE, payload, {
        db: transactionDatabase(client),
        singletonKey: payload.jobId,
      });
      if (!queuedId) throw new Error("Audit export could not be queued");
    },
  };
}

export async function requestAuditExport(
  pool: Pool,
  command: AuditExportCommand,
  enqueuer: AuditExportEnqueuer,
) {
  requirePermission(command.actor, PERMISSIONS.auditExport);
  const reason = command.justification.trim();
  const requestFingerprint = fingerprint(command);
  return withTransaction(pool, async (client) => {
    const claimed = await client.query(
      `INSERT INTO idempotency_record
        (scope, key, request_fingerprint, expires_at)
       VALUES ('audit:export', $1, $2, now() + interval '24 hours')
       ON CONFLICT DO NOTHING`,
      [command.idempotencyKey, requestFingerprint],
    );
    if (claimed.rowCount === 0) {
      const existing = await client.query<{
        request_fingerprint: string;
        response_reference: string | null;
      }>(
        `SELECT request_fingerprint, response_reference FROM idempotency_record
         WHERE scope = 'audit:export' AND key = $1 FOR UPDATE`,
        [command.idempotencyKey],
      );
      const record = existing.rows[0]!;
      if (record.request_fingerprint !== requestFingerprint) {
        throw Object.assign(new Error("Idempotency key conflict"), {
          code: "IDEMPOTENCY_CONFLICT",
          status: 409,
        });
      }
      if (record.response_reference) {
        return {
          jobId: record.response_reference,
          statusUrl: `/audit/exports/${record.response_reference}`,
        };
      }
      throw Object.assign(new Error("Equivalent export is processing"), {
        code: "IDEMPOTENCY_IN_PROGRESS",
        status: 409,
      });
    }

    const jobId = crypto.randomUUID();
    await createJobExecution(client, {
      id: jobId,
      jobType: AUDIT_EXPORT_QUEUE,
      queueName: AUDIT_EXPORT_QUEUE,
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      requestId: command.requestId,
      aggregateType: "audit_export",
      aggregateId: jobId,
      attemptLimit: 5,
    });
    const payload: AuditExportJobPayload = {
      schemaVersion: 1,
      jobId,
      correlationId: command.correlationId,
      requestId: command.requestId,
      requestedBy: command.actor.userId,
      from: command.from,
      to: command.to,
      ...(command.actorId ? { actorId: command.actorId } : {}),
      ...(command.action ? { action: command.action } : {}),
      ...(command.entityType ? { entityType: command.entityType } : {}),
    };
    await enqueuer.enqueue(client, payload);
    await writeAuditEvent(client, {
      actorUserId: command.actor.userId,
      effectiveIdentity: command.effectiveIdentity,
      action: "audit.export.requested",
      entityType: "audit_export",
      entityId: jobId,
      after: {
        from: command.from,
        to: command.to,
        actorId: command.actorId ?? null,
        action: command.action ?? null,
        entityType: command.entityType ?? null,
      },
      reason,
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    await client.query(
      `UPDATE idempotency_record SET status = 'completed', response_reference = $2,
       updated_at = now() WHERE scope = 'audit:export' AND key = $1`,
      [command.idempotencyKey, jobId],
    );
    return { jobId, statusUrl: `/audit/exports/${jobId}` };
  });
}

export async function findAuditExport(pool: Pool, actor: RequestActor, jobId: string) {
  requirePermission(actor, PERMISSIONS.auditExport);
  const result = await pool.query<{
    id: string;
    status: "queued" | "running" | "succeeded" | "failed";
    progress: number;
    safe_error_message: string | null;
    object_key: string | null;
  }>(
    `SELECT j.id, j.status, j.progress, j.safe_error_message, sf.object_key
     FROM job_execution j
     LEFT JOIN stored_file sf ON sf.owner_type = 'audit_export' AND sf.owner_id = j.id::text
       AND sf.status = 'available'
     WHERE j.id = $1 AND j.job_type = 'audit-export'`,
    [jobId],
  );
  return result.rows[0] ?? null;
}

export async function auditExportDownloadUrl(objectKey: string): Promise<string> {
  const env = loadServerEnv();
  const client = createStorageClient(env, true);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: env.S3_PRIVATE_BUCKET, Key: objectKey }),
    { expiresIn: 300 },
  );
}
