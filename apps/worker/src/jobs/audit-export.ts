import { createHash } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Pool } from "pg";
import { auditExportJobPayloadSchema, type AuditExportJobPayload } from "@caab/contracts";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { listAuditEvents } from "@caab/db/repositories/audit-query";

export async function runAuditExport(
  pool: Pool,
  s3: S3Client,
  bucket: string,
  untrustedPayload: AuditExportJobPayload,
): Promise<void> {
  const payload = auditExportJobPayloadSchema.parse(untrustedPayload);
  const completed = await pool.query(
    `SELECT 1 FROM stored_file
     WHERE owner_type = 'audit_export' AND owner_id = $1 AND status = 'available'
     LIMIT 1`,
    [payload.jobId],
  );
  if (completed.rowCount) return;

  const lines: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await listAuditEvents(pool, {
      cursor,
      limit: 100,
      actorId: payload.actorId,
      action: payload.action,
      entityType: payload.entityType,
      from: new Date(payload.from),
      to: new Date(payload.to),
    });
    lines.push(
      ...page.items.map((event) =>
        JSON.stringify({
          id: event.id,
          occurredAt: event.occurredAt.toISOString(),
          actorUserId: event.actorUserId,
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId,
          before: event.before,
          after: event.after,
          reason: event.reason,
          origin: event.origin,
          requestId: event.requestId,
          correlationId: event.correlationId,
        }),
      ),
    );
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  const body = `${lines.join("\n")}${lines.length ? "\n" : ""}`;
  const objectKey = `audit-exports/${payload.jobId}.jsonl`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: "application/x-ndjson",
    }),
  );
  await withTransaction(pool, async (client) => {
    const inserted = await client.query(
      `INSERT INTO stored_file
        (owner_type, owner_id, original_name, object_key, quarantine_key, detected_mime,
         declared_mime, size_bytes, checksum_sha256, status, scan_result, uploaded_by, available_at)
       VALUES ('audit_export', $1, $2, $3, $4, 'application/x-ndjson',
         'application/x-ndjson', $5, $6, 'available', 'clean', $7, now())
       ON CONFLICT (object_key) DO NOTHING`,
      [
        payload.jobId,
        `audit-export-${payload.jobId}.jsonl`,
        objectKey,
        `unused/${payload.jobId}`,
        Buffer.byteLength(body),
        createHash("sha256").update(body).digest("hex"),
        payload.requestedBy,
      ],
    );
    if (inserted.rowCount === 0) return;
    await writeAuditEvent(client, {
      actorUserId: payload.requestedBy,
      effectiveIdentity: `user:${payload.requestedBy}`,
      action: "audit.export.completed",
      entityType: "audit_export",
      entityId: payload.jobId,
      after: { objectKey, eventCount: lines.length },
      origin: "worker",
      requestId: payload.requestId,
      correlationId: payload.correlationId,
    });
  });
}
