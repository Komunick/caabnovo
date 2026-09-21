import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import {
  reportCatalog,
  reportChange,
  reportExportSchema,
  reportJobSchema,
  type ReportJob,
} from "@caab/contracts";
import { queryReport, reportError } from "@caab/db/repositories/reports";
import { currentExportOwner } from "@caab/db/repositories/legacy-exports";
import { reportSummary } from "@caab/db/repositories/report-summary";
import { reportUsage } from "@caab/db/repositories/report-analytics";
import {
  authorizeStoredExport,
  storedReportRequirements,
  type StoredReportExport,
} from "@caab/db/repositories/report-storage";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { reportCsv, reportPdf, reportXlsx, type ReportDocument } from "./report-format";

// Acquire the session lock before BEGIN so concurrent retries cannot read a stale
// repeatable-read snapshot. report_export remains immutable to the runtime role.
async function withExportSnapshot(pool: Pool, id: string, work: (db: PoolClient) => Promise<void>) {
  const db = await pool.connect();
  const key = `report-export:${id}`;
  let locked = false;
  let broken = false;
  try {
    locked = (
      await db.query<{ locked: boolean }>(
        "SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS locked",
        [key],
      )
    ).rows[0]!.locked;
    if (!locked) throw reportError("REPORT_BUSY", 503);
    await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    try {
      await work(db);
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } finally {
    if (locked) {
      try {
        await db.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [key]);
      } catch {
        broken = true;
      }
    }
    db.release(broken);
  }
}

export async function runReportExport(pool: Pool, raw: ReportJob) {
  const job = reportJobSchema.parse(raw);
  await withExportSnapshot(pool, job.jobId, async (db) => {
    await db.query("SET LOCAL statement_timeout='120s'");
    const record = (
      await db.query<{ owner_id: string; configuration: StoredReportExport }>(
        "SELECT owner_id,configuration FROM report_export WHERE id=$1",
        [job.jobId],
      )
    ).rows[0];
    if (!record) throw reportError("NOT_FOUND", 404);
    const actor = await currentExportOwner(pool, record.owner_id);
    authorizeStoredExport(actor, record.configuration);
    // Limit to permissions captured when requested; later grants do not broaden a queued file.
    actor.permissions = new Set(storedReportRequirements(record.configuration));
    const existing = await db.query(
      "SELECT id FROM stored_file WHERE owner_type='report_export' AND owner_id=$1 AND status='available'",
      [job.jobId],
    );
    if (existing.rowCount) return;
    const { query, format, notes } = reportExportSchema.parse(record.configuration.input);
    const generatedAt = new Date().toISOString();
    let doc: ReportDocument;
    const context = [
      `Período: ${query.from} a ${query.to} (America/Bahia)`,
      `Atualizado em: ${new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "medium" }).format(new Date(generatedAt))} (America/Bahia)`,
      `Canal: ${query.channel}; ambiente: ${query.environment}; fonte: ${query.source || "Todas"}`,
      ...(query.view === "details"
        ? [
            `Filtros: busca=${query.search || "Todos"}; situação=${query.status || "Todas"}; categoria=${query.category || "Todas"}; cidade=${query.city || "Todas"}`,
            `Ordenação: ${query.sort} ${query.direction}; agrupamento: ${query.groupBy || "Nenhum"}`,
          ]
        : [
            "Indicadores de negócio usam o período; canal, ambiente e fonte aplicam-se aos acessos. Filtros de registros aplicam-se somente à Análise detalhada.",
          ]),
    ];
    if (query.view === "details") {
      const table = await queryReport(db, actor, query, true);
      doc = {
        title: reportCatalog[query.dataset].label,
        context: [...context, table.definition, `${table.total} registro(s)`],
        columns: table.columns,
        rows: table.rows,
        notes,
      };
    } else {
      const summary = await reportSummary(db, actor, query),
        usage = await reportUsage(db, query);
      doc = {
        title: query.view === "executive" ? "Resultados e evolução" : "Resumo gerencial",
        context: [
          ...context,
          ...summary.notices,
          `Início da coleta: ${usage.firstEvent ?? "Sem dados"}`,
        ],
        columns: {
          label: "Indicador",
          value: "Atual",
          previous: "Anterior",
          change: "Variação (%)",
          definition: "Definição",
        },
        rows: [
          ...summary.inventory.map((metric) => ({ ...metric, previous: null, change: null })),
          ...summary.metrics.map((metric) => ({
            label: metric.label,
            value: metric.value,
            previous: metric.previous,
            change: metric.change,
            definition: metric.definition,
          })),
          ...[
            { label: "Visualizações", value: usage.views, previous: usage.previous.views },
            { label: "Sessões", value: usage.sessions, previous: usage.previous.sessions },
            {
              label: "Visitantes reconhecidos",
              value: usage.visitors,
              previous: usage.previous.visitors,
            },
            { label: "Contas ativas", value: usage.accounts, previous: usage.previous.accounts },
          ].map((metric) => ({
            ...metric,
            change: reportChange(metric.value, metric.previous),
            definition: usage.firstEvent
              ? "Coleta observada no período; não equivale a pessoas entre canais."
              : "Sem dados de coleta.",
          })),
        ],
        notes,
        chart: [
          ...usage.series.map((point) => ({
            label: `${point.date} Visualizações`,
            value: point.views,
          })),
          ...summary.series.map((point) => ({
            label: `${point.date} ${reportCatalog[point.dataset as keyof typeof reportCatalog].label}`,
            value: point.value,
          })),
        ],
      };
    }
    const body =
      format === "csv"
        ? reportCsv(doc)
        : format === "xlsx"
          ? await reportXlsx(doc)
          : await reportPdf(doc);
    const mime =
      format === "csv"
        ? "text/csv; charset=utf-8"
        : format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";
    const name = `caab-${query.view}-${query.from}-${query.to}.${format}`,
      key = `database/report-exports/${job.jobId}.${format}`;
    authorizeStoredExport(await currentExportOwner(pool, record.owner_id), record.configuration);
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO stored_file(owner_type,owner_id,original_name,object_key,quarantine_key,detected_mime,declared_mime,size_bytes,checksum_sha256,status,scan_result,uploaded_by,available_at)
      VALUES('report_export',$1,$2,$3,$4,$5,$5,$6,$7,'available','clean',$8,now()) RETURNING id`,
      [
        job.jobId,
        name,
        key,
        `unused/${job.jobId}`,
        mime,
        body.length,
        createHash("sha256").update(body).digest("hex"),
        actor.userId,
      ],
    );
    await db.query("INSERT INTO stored_file_content(file_id,object_key,body) VALUES($1,$2,$3)", [
      inserted.rows[0]!.id,
      key,
      body,
    ]);
    await writeAuditEvent(db, {
      actorUserId: actor.userId,
      effectiveIdentity: `user:${actor.userId}`,
      action: "report.export.completed",
      entityType: "report_export",
      entityId: job.jobId,
      after: { format, rows: doc.rows.length, generatedAt },
      origin: "worker",
      requestId: job.requestId,
      correlationId: job.correlationId,
    });
  });
}
