import { currentExportOwner } from "./export-authority";
import { createHash, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import {
  reportCatalog,
  reportExportSchema,
  savedReportSchema,
  type ReportExportInput,
} from "@caab/contracts";
import { withTransaction } from "../client";
import { writeAuditEvent } from "./audit-writer";
import { createJobExecution } from "./job-execution";
import { authorizeReport, reportError, type ReportActor, type ReportDb } from "./reports";

export async function savedReports(db: ReportDb, actor: ReportActor) {
  authorizeReport(actor);
  return (
    await db.query(
      "SELECT id,name,configuration,version FROM report_query WHERE owner_id=$1 ORDER BY updated_at DESC,id",
      [actor.userId],
    )
  ).rows;
}
export async function saveReport(pool: Pool, actor: ReportActor, input: unknown, id?: string) {
  const data = savedReportSchema.parse(input);
  authorizeReport(actor, data.query);
  const configuration = { query: data.query, notes: data.notes };
  const result = id
    ? await pool.query(
        "UPDATE report_query SET name=$3,configuration=$4,version=version+1,updated_at=now() WHERE id=$1 AND owner_id=$2 AND version=$5 RETURNING id,name,configuration,version",
        [id, actor.userId, data.name, configuration, data.version ?? 0],
      )
    : await pool.query(
        "INSERT INTO report_query(owner_id,name,configuration) VALUES($1,$2,$3) RETURNING id,name,configuration,version",
        [actor.userId, data.name, configuration],
      );
  if (!result.rows[0]) throw reportError("REPORT_QUERY_CONFLICT", 409);
  return result.rows[0];
}
export async function deleteReport(pool: Pool, actor: ReportActor, id: string, version: number) {
  authorizeReport(actor);
  const result = await pool.query(
    "DELETE FROM report_query WHERE id=$1 AND owner_id=$2 AND version=$3",
    [id, actor.userId, version],
  );
  if (!result.rowCount) throw reportError("REPORT_QUERY_CONFLICT", 409);
}
export type StoredReportExport = {
  input: ReportExportInput;
  permissions: string[];
  generatorVersion?: number;
};
export const canonicalExportPermission = (permission: string) =>
  permission === "audit:export" || permission === "reports:export"
    ? "exports:generate"
    : permission;
export function storedReportRequirements(configuration: StoredReportExport): string[] {
  // PR34 was the sole unversioned persisted generator; its complete parsed shape is known.
  // Unknown versions or incomplete metadata cannot establish the contents of old bytes.
  if (
    !configuration ||
    !Array.isArray(configuration.permissions) ||
    configuration.permissions.some((key) => typeof key !== "string") ||
    (configuration.generatorVersion !== undefined && configuration.generatorVersion !== 2) ||
    !configuration.input?.query?.view ||
    !configuration.input.query.dataset ||
    !configuration.input.query.from ||
    !configuration.input.query.to
  )
    throw reportError("REPORT_SOURCE_UNKNOWN", 409);
  const parsed = reportExportSchema.safeParse(configuration.input);
  if (!parsed.success) throw reportError("REPORT_SOURCE_UNKNOWN", 409);
  const query = parsed.data.query;
  return [
    ...new Set([
      "reports:read",
      "exports:generate",
      ...configuration.permissions.map(canonicalExportPermission),
      ...(query.view === "details"
        ? [
            query.dataset === "bookings"
              ? "scheduling:read"
              : reportCatalog[query.dataset].permission,
          ].filter(Boolean)
        : configuration.generatorVersion === 2
          ? []
          : ["scheduling:read"]),
    ]),
  ];
}
export function authorizeStoredExport(actor: ReportActor, configuration: StoredReportExport) {
  const required = storedReportRequirements(configuration);
  authorizeReport(actor, configuration.input.query, true);
  if (required.some((permission) => !actor.permissions.has(permission)))
    throw reportError("PERMISSION_DENIED");
}
export async function requestReportExport(
  pool: Pool,
  actor: ReportActor,
  input: unknown,
  context: { key: string; requestId: string; correlationId: string },
  enqueue: (db: PoolClient, jobId: string) => Promise<void>,
) {
  const parsed = reportExportSchema.parse(input);
  parsed.query.page = 1;
  authorizeReport(actor, parsed.query, true);
  const fingerprint = createHash("sha256").update(JSON.stringify(parsed)).digest("hex");
  const required = [
    "reports:read",
    "exports:generate",
    ...(parsed.query.view === "details"
      ? [reportCatalog[parsed.query.dataset].permission]
      : ["members:read", "partners:read", "news:read", "users:read", "scheduling:read"]
    ).filter((permission) => actor.permissions.has(permission)),
  ];
  return withTransaction(pool, async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `report:${actor.userId}:${context.key}`,
    ]);
    const prior = (
      await db.query<{ id: string; fingerprint: string }>(
        "SELECT id,fingerprint FROM report_export WHERE owner_id=$1 AND idempotency_key=$2",
        [actor.userId, context.key],
      )
    ).rows[0];
    if (prior) {
      if (prior.fingerprint !== fingerprint) throw reportError("IDEMPOTENCY_CONFLICT", 409);
      return { id: prior.id };
    }
    const id = randomUUID();
    await createJobExecution(db, {
      id,
      jobType: "report-export",
      queueName: "report-export",
      idempotencyKey: `${actor.userId}:${context.key}`,
      requestId: context.requestId,
      correlationId: context.correlationId,
      aggregateType: "report_export",
      aggregateId: id,
      attemptLimit: 5,
    });
    await db.query(
      "INSERT INTO report_export(id,owner_id,configuration,fingerprint,idempotency_key) VALUES($1,$2,$3,$4,$5)",
      [
        id,
        actor.userId,
        { input: parsed, permissions: required, generatorVersion: 2 },
        fingerprint,
        context.key,
      ],
    );
    await enqueue(db, id);
    await writeAuditEvent(db, {
      actorUserId: actor.userId,
      effectiveIdentity: `user:${actor.userId}`,
      action: "report.export.requested",
      entityType: "report_export",
      entityId: id,
      after: {
        format: parsed.format,
        dataset: parsed.query.dataset,
        from: parsed.query.from,
        to: parsed.query.to,
      },
      origin: "web",
      requestId: context.requestId,
      correlationId: context.correlationId,
    });
    return { id };
  });
}
export async function reportExports(db: ReportDb, actor: ReportActor, page = 1) {
  authorizeReport(actor, undefined, true);
  return (
    await db.query(
      `SELECT e.id,e.configuration->'input' AS configuration,e.created_at,
      CASE WHEN j.status='failed' AND j.attempt_count<j.attempt_limit THEN 'retrying' ELSE j.status::text END AS status,
      j.attempt_count,j.attempt_limit,j.progress,j.safe_error_code
    FROM report_export e JOIN job_execution j ON j.id=e.id WHERE e.owner_id=$1 ORDER BY e.created_at DESC,e.id LIMIT 21 OFFSET $2`,
      [actor.userId, (page - 1) * 20],
    )
  ).rows;
}
export async function reportExportDownload(
  db: ReportDb,
  actor: ReportActor & { sessionId?: string },
  id: string,
) {
  const result = await db.query<{
    owner_id: string;
    configuration: StoredReportExport;
    body: Buffer;
    mime: string;
    name: string;
  }>(
    `SELECT e.owner_id,e.configuration,c.body,f.detected_mime AS mime,f.original_name AS name
    FROM report_export e JOIN stored_file f ON f.owner_type='report_export' AND f.owner_id=e.id::text AND f.status='available' AND f.deleted_at IS NULL
    JOIN stored_file_content c ON c.file_id=f.id WHERE e.id=$1 AND e.owner_id=$2`,
    [id, actor.userId],
  );
  const row = result.rows[0];
  if (!row) throw reportError("NOT_FOUND", 404);
  authorizeStoredExport(
    await currentExportOwner(db, actor.userId, actor.sessionId),
    row.configuration,
  );
  return row;
}
