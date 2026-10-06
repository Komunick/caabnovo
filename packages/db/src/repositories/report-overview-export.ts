import { reportBounds, reportCatalog, type ReportDataset } from "@caab/contracts";
import { reportSources, reportError } from "./reports";
import { reportInventory, reportMetricDefinition, reportMetricLabel } from "./report-summary";
import { reportUsageFunnelSql } from "./report-analytics";

export const overviewColumns = {
  section: "Seção",
  label: "Indicador",
  date: "Mês",
  value: "Atual",
  previous: "Anterior",
  change: "Variação (%)",
  definition: "Definição",
  from: "Data inicial",
  to: "Data final",
  channel: "Canal",
  environment: "Ambiente",
  source: "Fonte",
  updatedAt: "Atualizado em (UTC)",
  notes: "Análise da gestão",
} as const;
export type OverviewInput = {
  from: string;
  to: string;
  channel: string;
  environment: string;
  source: string;
  notes: string;
  datasets: Exclude<ReportDataset, "access">[];
};

/** One read-only cursor/snapshot for all selected aggregates, never a capped detail query. */
export function reportOverviewExportSql(
  input: OverviewInput,
  columns: readonly string[],
  sort: readonly { field: string; direction: "asc" | "desc" }[],
  presentation = false,
) {
  if (
    !columns.length ||
    columns.some((key) => !Object.hasOwn(overviewColumns, key)) ||
    sort.some((entry) => !Object.hasOwn(overviewColumns, entry.field)) ||
    input.datasets.some((key) => !Object.hasOwn(reportSources, key))
  )
    throw reportError("EXPORT_CONFIGURATION_INVALID", 422);
  const { from, until, previousFrom } = reportBounds(input);
  const values: unknown[] = [
    from,
    until,
    previousFrom,
    input.environment,
    input.channel,
    input.source,
  ];
  const parameter = (value: string) => {
    values.push(value);
    return `$${values.length}::text`;
  };
  const parts: string[] = [];
  const row = (
    id: string,
    section: string,
    label: string,
    value: string,
    definition: string,
    tail = "",
    previous = "NULL::numeric",
    date = "NULL::text",
  ) => {
    parts.push(`SELECT ${id}::text AS id,jsonb_build_object('section',${parameter(section)},
      'label',${label},'date',${date},'value',${value},'previous',${previous},
      'definition',${definition}) AS cells ${tail}`);
  };
  for (const dataset of input.datasets) {
    row(
      parameter(`metric:${dataset}`),
      "Indicadores",
      parameter(reportMetricLabel(dataset)),
      "value",
      parameter(reportMetricDefinition(dataset)),
      `FROM (SELECT count(*) FILTER(WHERE at >= $1 AND at < $2) AS value,
        count(*) FILTER(WHERE at >= $3 AND at < $1) AS previous
        FROM (${reportSources[dataset]}) source WHERE at >= $3 AND at < $2) totals`,
      "previous",
    );
    row(
      `${parameter(`series:${dataset}:`)} || month`,
      "Evolução",
      parameter(reportCatalog[dataset].label),
      "value",
      parameter(reportMetricDefinition(dataset)),
      `FROM (SELECT to_char(at AT TIME ZONE 'America/Bahia','YYYY-MM') AS month,count(*) AS value
        FROM (${reportSources[dataset]}) source WHERE at >= $1 AND at < $2 GROUP BY 1) months`,
      "NULL::numeric",
      "month",
    );
  }
  for (const [index, item] of reportInventory.entries()) {
    // These inventory figures are independent of the period, exactly as in the screen.
    if (!input.datasets.includes(item.dataset)) continue;
    row(
      parameter(`inventory:${index}`),
      "Base atual",
      parameter(item.label),
      "total::numeric",
      parameter(
        "Situação atual de toda a base, independente do período. Sem reconstrução retroativa.",
      ),
      `FROM (${item.sql}) inventory`,
    );
  }
  const scope = "environment=$4 AND ($5='all' OR channel=$5) AND ($6='' OR source=$6)";
  const count = `count(*) FILTER(WHERE event='page_view') AS views,count(DISTINCT session_hash) AS sessions,
    count(DISTINCT visitor_hash) AS visitors,count(DISTINCT account_hash) AS accounts`;
  const ctes = `current_usage AS (SELECT ${count} FROM analytics_event WHERE ${scope} AND occurred_at >= $1 AND occurred_at < $2),
    previous_usage AS (SELECT ${count} FROM analytics_event WHERE ${scope} AND occurred_at >= $3 AND occurred_at < $1),
    coverage AS (SELECT min(occurred_at) AS first_event,max(occurred_at) AS last_event FROM analytics_event WHERE ${scope}),
    funnel AS MATERIALIZED (${reportUsageFunnelSql(scope, "$1", "$2")})`;
  for (const [key, label] of Object.entries({
    views: "Visualizações",
    sessions: "Sessões",
    visitors: "Visitantes reconhecidos",
    accounts: "Contas ativas",
  })) {
    row(
      parameter(`usage:${key}`),
      "Acessos e uso",
      parameter(label),
      `c.${key}`,
      "CASE WHEN coverage.first_event IS NULL THEN 'Sem dados de coleta.' ELSE 'Coleta observada no período; não equivale a pessoas entre canais.' END",
      "FROM current_usage c CROSS JOIN previous_usage p CROSS JOIN coverage",
      `p.${key}`,
    );
  }
  row(
    parameter("usage:returning"),
    "Acessos e uso",
    parameter("Visitantes que retornaram"),
    "count(DISTINCT e.visitor_hash)",
    parameter("Visitantes reconhecidos com evento anterior ao período na mesma fonte e ambiente."),
    `FROM analytics_event e WHERE ${scope} AND occurred_at >= $1 AND occurred_at < $2 AND EXISTS
      (SELECT 1 FROM analytics_event old WHERE old.environment=e.environment AND old.source=e.source
        AND old.visitor_hash=e.visitor_hash AND old.occurred_at<$1)`,
  );
  for (const [key, label, expression] of [
    [
      "recent",
      "Sessões recentes",
      "count(DISTINCT session_hash) FILTER(WHERE occurred_at>now()-interval '5 minutes')",
    ],
    [
      "daily",
      "Contas ativas no último dia",
      "count(DISTINCT account_hash) FILTER(WHERE occurred_at >= $2::timestamptz-interval '1 day' AND occurred_at < $2)",
    ],
    [
      "weekly",
      "Contas ativas nos últimos 7 dias",
      "count(DISTINCT account_hash) FILTER(WHERE occurred_at >= $2::timestamptz-interval '7 days' AND occurred_at < $2)",
    ],
    [
      "monthly",
      "Contas ativas nos últimos 30 dias",
      "count(DISTINCT account_hash) FILTER(WHERE occurred_at >= $2::timestamptz-interval '30 days' AND occurred_at < $2)",
    ],
  ] as const) {
    row(
      parameter(`usage:${key}`),
      "Acessos e uso",
      parameter(label),
      expression,
      parameter(
        key === "recent"
          ? "Últimos cinco minutos em relação à geração."
          : "Janela encerrada no fim do período selecionado.",
      ),
      `FROM analytics_event WHERE ${scope}`,
    );
  }
  row(
    "'usage:series:' || month",
    "Evolução",
    parameter("Visualizações"),
    "value",
    parameter("Visualizações por mês, no canal, ambiente e fonte selecionados."),
    `FROM (SELECT to_char(occurred_at AT TIME ZONE 'America/Bahia','YYYY-MM') AS month,count(*) AS value
      FROM analytics_event WHERE ${scope} AND occurred_at >= $1 AND occurred_at < $2 AND event='page_view' GROUP BY 1) months`,
    "NULL::numeric",
    "month",
  );
  row(
    "'coverage:' || source || ':' || channel",
    "Cobertura",
    "source || ' (' || channel || ')'",
    "count(*)",
    "'Coleta: ' || min(occurred_at)::text || ' a ' || max(occurred_at)::text",
    `FROM analytics_event WHERE ${scope} GROUP BY source,channel`,
  );
  row(
    parameter("coverage:start"),
    "Contexto",
    parameter("Início da coleta"),
    "NULL::numeric",
    "coalesce(first_event::text,'Sem dados')",
    "FROM coverage",
  );
  for (const [key, label] of Object.entries({
    opened: "Abriu Agendamentos",
    service: "Selecionou serviço",
    slot: "Selecionou horário",
    confirmed: "Confirmou reserva",
  })) {
    row(
      parameter(`funnel:${key}`),
      "Jornada de agendamento",
      parameter(label),
      `${key}::numeric`,
      parameter("Sessões com etapas em sequência. Etapa sem coleta não comprova abandono."),
      "FROM funnel",
    );
  }
  row(
    parameter("notice:comparison"),
    "Contexto",
    parameter("Comparação"),
    "NULL::numeric",
    parameter(
      "Período anterior com a mesma duração. Base anterior zero: variação percentual não calculada.",
    ),
  );
  row(
    parameter("notice:state"),
    "Contexto",
    parameter("Situação atual"),
    "NULL::numeric",
    parameter(
      "Situações atuais não representam situações históricas. Reservas não comprovam atendimento realizado.",
    ),
  );
  if (input.datasets.includes("bookings")) {
    row(
      parameter("notice:cancelled"),
      "Avisos",
      parameter("Reservas canceladas no período"),
      "count(*)",
      parameter("Reserva(s) do período canceladas atualmente."),
      "FROM scheduling_booking WHERE status='cancelled' AND coalesce(starts_at,original_start,created_at) >= $1 AND coalesce(starts_at,original_start,created_at) < $2",
    );
  }
  if (input.datasets.includes("contracts")) {
    row(
      parameter("notice:expiring"),
      "Avisos",
      parameter("Contratos a vencer em 30 dias"),
      "count(*)",
      parameter("Contratos aprovados com vencimento nos próximos 30 dias a partir de hoje."),
      "FROM partner_contract WHERE status='approved' AND ends_on BETWEEN (now() AT TIME ZONE 'America/Bahia')::date AND (now() AT TIME ZONE 'America/Bahia')::date+30",
    );
  }
  const context = `jsonb_build_object('from',${parameter(input.from)},'to',${parameter(input.to)},
    'channel',$5::text,'environment',$4::text,'source',$6::text,'updatedAt',to_char(transaction_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'notes',${parameter(input.notes)})`;
  const change = `CASE WHEN cells->>'previous' IS NULL THEN NULL WHEN (cells->>'previous')::numeric=0
    THEN CASE WHEN (cells->>'value')::numeric=0 THEN 0 ELSE NULL END
    ELSE floor((((cells->>'value')::numeric-(cells->>'previous')::numeric)/(cells->>'previous')::numeric)*1000+0.5)/10 END`;
  const order = sort.map(
    (entry) => `cells->'${entry.field}' ${entry.direction === "desc" ? "DESC" : "ASC"}`,
  );
  return {
    text: `WITH ${ctes}, rows AS (${parts.join(" UNION ALL ")}), contextual AS
      (SELECT id,cells || ${context} || jsonb_build_object('change',${change}) AS cells FROM rows)
      SELECT id AS "_recordId",${columns.map((key) => `cells->'${key}' AS "${key}"`).join(",")}${presentation ? ", CASE WHEN cells->>'date' IS NOT NULL THEN jsonb_build_object('label',cells->>'date' || ' ' || (cells->>'label'),'value',cells->'value') END AS \"_chart\"" : ""}
      FROM contextual ORDER BY ${[...order, "id ASC"].join(",")}`,
    values,
  };
}
