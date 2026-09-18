import {
  reportBounds,
  reportChange,
  reportCatalog,
  type ReportQuery,
  type ReportSummary,
} from "@caab/contracts";
import { allowedReports, reportSources, type ReportDb, type ReportActor } from "./reports";
export async function reportSummary(
  db: ReportDb,
  actor: ReportActor,
  query: ReportQuery,
): Promise<ReportSummary> {
  const { from, until, previousFrom } = reportBounds(query);
  const metrics: ReportSummary["metrics"] = [],
    series: ReportSummary["series"] = [];
  for (const dataset of allowedReports(actor)) {
    if (dataset === "access") continue;
    const result = await db.query<{ value: string; previous: string }>(
      `SELECT count(*) FILTER(WHERE at >= $1 AND at < $2)::text AS value,count(*) FILTER(WHERE at >= $3 AND at < $1)::text AS previous FROM (${reportSources[dataset]}) source WHERE at >= $3 AND at < $2`,
      [from, until, previousFrom],
    );
    const value = Number(result.rows[0]!.value),
      previous = Number(result.rows[0]!.previous);
    const definition = `${reportCatalog[dataset].dateLabel} no período. Situação atual; não reconstrói estados passados.`;
    metrics.push({
      id: dataset,
      label:
        dataset === "contracts"
          ? "Contratos com vencimento no período"
          : dataset === "bookings"
            ? "Reservas no período"
            : `${reportCatalog[dataset].label} cadastrados no período`,
      value,
      previous,
      change: reportChange(value, previous),
      definition,
    });
    const months = await db.query<{ date: string; value: string }>(
      `SELECT to_char(at AT TIME ZONE 'America/Bahia','YYYY-MM') AS date,count(*)::text AS value FROM (${reportSources[dataset]}) source WHERE at >= $1 AND at < $2 GROUP BY 1 ORDER BY 1`,
      [from, until],
    );
    series.push(
      ...months.rows.map((row) => ({ date: row.date, dataset, value: Number(row.value) })),
    );
  }
  const notices = [
    "Período anterior com a mesma duração. Base anterior zero: variação percentual não calculada.",
    "Situações atuais não representam situações históricas. Reservas não comprovam atendimento realizado.",
  ];
  if (actor.permissions.has("partners:read")) {
    const expiring = await db.query<{ total: string }>(
      "SELECT count(*)::text AS total FROM partner_contract WHERE status='approved' AND ends_on BETWEEN (now() AT TIME ZONE 'America/Bahia')::date AND (now() AT TIME ZONE 'America/Bahia')::date+30",
    );
    notices.push(
      `${expiring.rows[0]!.total} contrato(s) aprovado(s) vencem nos próximos 30 dias, a partir de hoje.`,
    );
  }
  return { metrics, series, notices, updatedAt: new Date().toISOString() };
}
