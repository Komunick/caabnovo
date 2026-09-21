import type { Pool, PoolClient } from "pg";
import type { ExportFormat, ExportOperation, ExportPhase } from "@caab/contracts";
import { withTransaction } from "../client";
import { writeAuditEvent } from "./audit-writer";
export type OperationIdentity = {
  requestId: string;
  actorId: string;
  module: string;
  dataset: string;
  format: ExportFormat;
  correlationId: string;
};
async function audit(
  db: PoolClient,
  operation: OperationIdentity,
  phase: ExportPhase,
  counts: { rows: number; bytes: number },
  errorCode?: string,
) {
  await writeAuditEvent(db, {
    actorUserId: operation.actorId,
    effectiveIdentity: `user:${operation.actorId}`,
    action: phase === "preparing" ? "export.started" : "export.finished",
    entityType: "export_operation",
    entityId: operation.requestId,
    after: {
      module: operation.module,
      dataset: operation.dataset,
      format: operation.format,
      phase,
      rowCount: counts.rows,
      byteCount: counts.bytes,
      errorCode,
    },
    origin: "web",
    requestId: operation.requestId,
    correlationId: operation.correlationId,
  });
}
export async function beginExportOperation(pool: Pool, operation: OperationIdentity) {
  return withTransaction(pool, async (db) => {
    const inserted = await db.query(
      "INSERT INTO export_operation(request_id,actor_id,module,dataset,format,correlation_id) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING request_id",
      [
        operation.requestId,
        operation.actorId,
        operation.module,
        operation.dataset,
        operation.format,
        operation.correlationId,
      ],
    );
    if (!inserted.rowCount)
      throw Object.assign(new Error("EXPORT_ALREADY_STARTED"), {
        code: "EXPORT_ALREADY_STARTED",
        status: 409,
      });
    await audit(db, operation, "preparing", { rows: 0, bytes: 0 });
  });
}
export async function updateExportOperation(
  pool: Pool,
  operation: OperationIdentity,
  phase: ExportPhase,
  counts: { rows: number; bytes: number },
  errorCode?: string,
) {
  return withTransaction(pool, async (db) => {
    await db.query("SET LOCAL statement_timeout='5s'");
    const terminal = !["preparing", "streaming"].includes(phase);
    const updated = await db.query(
      `UPDATE export_operation SET phase=$3,row_count=$4,byte_count=$5,heartbeat_at=clock_timestamp(),finished_at=CASE WHEN $6 THEN clock_timestamp() ELSE NULL END,error_code=$7 WHERE request_id=$1 AND actor_id=$2 AND phase IN ('preparing','streaming') RETURNING request_id`,
      [
        operation.requestId,
        operation.actorId,
        phase,
        counts.rows,
        counts.bytes,
        terminal,
        errorCode ?? null,
      ],
    );
    if (!updated.rowCount)
      throw Object.assign(new Error("EXPORT_OPERATION_CLOSED"), {
        code: "EXPORT_OPERATION_CLOSED",
      });
    if (terminal) await audit(db, operation, phase, counts, errorCode);
  });
}
export async function findExportOperation(
  pool: Pool,
  actorId: string,
  requestId: string,
): Promise<ExportOperation | null> {
  return withTransaction(pool, async (db) => {
    await db.query("SET LOCAL statement_timeout='5s'");
    const stale = await db.query(
      `UPDATE export_operation SET phase='interrupted',finished_at=clock_timestamp(),error_code='EXPORT_INTERRUPTED' WHERE request_id=$1 AND actor_id=$2 AND phase IN ('preparing','streaming') AND heartbeat_at < clock_timestamp()-interval '60 seconds' RETURNING module,dataset,format,correlation_id,row_count,byte_count`,
      [requestId, actorId],
    );
    if (stale.rows[0]) {
      const r = stale.rows[0];
      await audit(
        db,
        {
          requestId,
          actorId,
          module: r.module,
          dataset: r.dataset,
          format: r.format,
          correlationId: r.correlation_id,
        },
        "interrupted",
        { rows: Number(r.row_count), bytes: Number(r.byte_count) },
        "EXPORT_INTERRUPTED",
      );
    }
    const result = await db.query(
      "SELECT phase,row_count,byte_count,error_code FROM export_operation WHERE request_id=$1 AND actor_id=$2",
      [requestId, actorId],
    );
    const row = result.rows[0];
    return row
      ? {
          requestId,
          phase: row.phase,
          rowCount: Number(row.row_count),
          byteCount: Number(row.byte_count),
          errorCode: row.error_code,
        }
      : null;
  });
}
