import type { Pool, PoolClient } from "pg";
import {
  reportBounds,
  reportCatalog,
  reportQuerySchema,
  type ReportDataset,
  type ReportQuery,
  type ReportTable,
  type ReportRow,
} from "@caab/contracts";
export type ReportDb = Pick<Pool | PoolClient, "query">;
export type ReportActor = { userId: string; permissions: ReadonlySet<string> };
export function reportError(code: string, status = 403) {
  return Object.assign(new Error(code), { code, status });
}
export function authorizeReport(actor: ReportActor, query?: ReportQuery, exporting = false) {
  if (
    !actor.permissions.has("reports:read") ||
    (exporting && !actor.permissions.has("reports:export"))
  )
    throw reportError("PERMISSION_DENIED");
  if (query?.view === "details") {
    const permission = reportCatalog[query.dataset].permission;
    if (permission && !actor.permissions.has(permission)) throw reportError("PERMISSION_DENIED");
  }
}
export function allowedReports(actor: ReportActor) {
  authorizeReport(actor);
  return (Object.keys(reportCatalog) as ReportDataset[]).filter(
    (key) => !reportCatalog[key].permission || actor.permissions.has(reportCatalog[key].permission),
  );
}
export async function currentReportActor(db: ReportDb, userId: string): Promise<ReportActor> {
  const user = await db.query("SELECT id FROM \"user\" WHERE id=$1 AND status='active'", [userId]);
  if (!user.rowCount) throw reportError("PERMISSION_DENIED");
  const permissions = await db.query<{ permission: string }>(
    "SELECT permission FROM effective_user_permission WHERE user_id=$1",
    [userId],
  );
  return { userId, permissions: new Set(permissions.rows.map((row) => row.permission)) };
}

// Only static, reviewed projections enter SQL. No identifiers/expressions come from callers.
export const reportSources: Record<Exclude<ReportDataset, "access">, string> = {
  members: `SELECT id::text,created_at AS at,jsonb_build_object('name',name,'city',city,'state',residence_state,'category',category,
    'status',CASE WHEN archived_at IS NOT NULL THEN 'Arquivado' WHEN administrative_status='active' THEN 'Ativo' WHEN administrative_status='blocked' THEN 'Bloqueado' ELSE 'Inativo' END,
    'gender',CASE gender WHEN 'female' THEN 'Feminino' WHEN 'male' THEN 'Masculino' WHEN 'nonbinary' THEN 'Não binário' WHEN 'other' THEN 'Outro' ELSE 'Não informado' END,
    'age',extract(year from age(current_date,birth_date))::integer) AS cells FROM member`,
  dependents: `SELECT r.id::text,r.created_at AS at,jsonb_build_object('name',d.name,'holder',h.name,'category',r.relationship,'status',CASE WHEN r.ended_at IS NULL THEN 'Ativo' ELSE 'Encerrado' END) AS cells FROM member_relationship r JOIN member d ON d.id=r.dependent_id JOIN member h ON h.id=r.holder_id`,
  bookings: `SELECT b.id::text,b.starts_at AS at,jsonb_build_object('name',p.name,'category',s.name,'unit',u.name,'professional',f.name,'status',CASE b.status WHEN 'scheduled' THEN 'Agendado' ELSE 'Cancelado' END) AS cells FROM scheduling_booking b JOIN scheduling_assignment a ON a.id=b.assignment_id JOIN scheduling_procedure p ON p.id=a.procedure_id JOIN scheduling_service s ON s.id=p.service_id JOIN scheduling_unit u ON u.id=a.unit_id JOIN scheduling_professional f ON f.id=b.professional_id`,
  partners: `SELECT id::text,created_at AS at,jsonb_build_object('name',profile->>'name','category',profile->>'category','status',CASE WHEN archived_at IS NOT NULL THEN 'Arquivado' WHEN status='active' THEN 'Ativo' ELSE 'Suspenso' END) AS cells FROM partner`,
  benefits: `SELECT b.id::text,b.created_at AS at,jsonb_build_object('name',b.draft->>'title','partner',p.profile->>'name','status',CASE WHEN b.published IS NULL THEN 'Rascunho' ELSE 'Publicado' END) AS cells FROM partner_benefit b JOIN partner p ON p.id=b.partner_id`,
  contracts: `SELECT c.id::text,(c.ends_on::timestamp AT TIME ZONE 'America/Bahia') AS at,jsonb_build_object('name',c.reference,'partner',p.profile->>'name','status',CASE c.status WHEN 'approved' THEN 'Aprovado' WHEN 'ended' THEN 'Encerrado' ELSE 'Rascunho' END) AS cells FROM partner_contract c JOIN partner p ON p.id=c.partner_id`,
  news: `SELECT id::text,created_at AS at,jsonb_build_object('name',metadata_title,'category',metadata_category,'status',CASE WHEN archived THEN 'Arquivada' WHEN _status='published' THEN 'Publicada' ELSE 'Rascunho' END) AS cells FROM news`,
  users: `SELECT id::text,created_at AS at,jsonb_build_object('name',name,'status',CASE status WHEN 'active' THEN 'Ativo' ELSE 'Inativo' END) AS cells FROM "user"`,
};

export function reportSql(query: ReportQuery) {
  const { from, until } = reportBounds(query);
  const values: unknown[] = [from, until];
  let base: string;
  if (query.dataset === "access") {
    values.push(query.environment, query.channel, query.source);
    base = `SELECT min(id::text) AS id,date_trunc('day',occurred_at AT TIME ZONE 'America/Bahia') AT TIME ZONE 'America/Bahia' AS at,
      jsonb_build_object('name',screen,'channel',channel,'source',source,'device',device,'origin',origin,'version',app_version,
        'views',count(*) FILTER(WHERE event='page_view'),'sessions',count(DISTINCT session_hash),'visitors',count(DISTINCT visitor_hash)) AS cells
      FROM analytics_event WHERE occurred_at >= $1 AND occurred_at < $2 AND environment=$3
      AND ($4='all' OR channel=$4) AND ($5='' OR source=$5)
      GROUP BY date_trunc('day',occurred_at AT TIME ZONE 'America/Bahia'),screen,channel,source,device,origin,app_version`;
  } else base = reportSources[query.dataset];
  const filters =
    query.dateScope === "all" && query.dataset !== "access"
      ? ["$1::timestamptz IS NOT NULL", "$2::timestamptz IS NOT NULL"]
      : ["at >= $1", "at < $2"];
  for (const [field, value] of [
    ["name", query.search],
    ["status", query.status],
    ["category", query.category],
    ["city", query.city],
  ]) {
    if (!value) continue;
    if (field === "status") {
      values.push(value);
      filters.push(`lower(cells->>'status') = lower($${values.length})`);
      continue;
    }
    values.push(`%${value.replace(/[\\%_]/g, "\\$&")}%`);
    filters.push(`cells->>'${field}' ILIKE $${values.length}`);
  }
  const filtered = `SELECT id,at,cells || jsonb_build_object('date',to_char(at AT TIME ZONE 'America/Bahia','YYYY-MM-DD')) AS cells FROM (${base}) source WHERE ${filters.join(" AND ")}`;
  if (query.groupBy)
    return {
      sql: `SELECT COALESCE(cells->>'${query.groupBy}','Não informado') AS id,jsonb_build_object('group',COALESCE(NULLIF(cells->>'${query.groupBy}',''),'Não informado'),'count',count(*)) AS cells FROM (${filtered}) filtered GROUP BY COALESCE(cells->>'${query.groupBy}','Não informado'),COALESCE(NULLIF(cells->>'${query.groupBy}',''),'Não informado')`,
      values,
    };
  return { sql: filtered, values };
}
export async function queryReport(
  db: ReportDb,
  actor: ReportActor,
  input: unknown,
  exportAll = false,
): Promise<ReportTable> {
  const query = reportQuerySchema.parse(input);
  authorizeReport(actor, { ...query, view: "details" }, exportAll);
  const { sql, values } = reportSql(query);
  const count = await db.query<{ total: string }>(
    `SELECT count(*)::text AS total FROM (${sql}) report`,
    values,
  );
  const total = Number(count.rows[0]!.total);
  if (exportAll && total > 50000) throw reportError("REPORT_TOO_LARGE", 422);
  const columns: Record<string, string> = query.groupBy
    ? {
        group: (reportCatalog[query.dataset].columns as Record<string, string>)[query.groupBy]!,
        count: "Quantidade",
      }
    : Object.fromEntries(
        Object.entries(reportCatalog[query.dataset].columns).filter(
          ([key]) => !query.columns.length || query.columns.includes(key),
        ),
      );
  const order = query.groupBy
    ? "(cells->>'count')::bigint DESC,id"
    : query.sort === "date"
      ? `at ${query.direction},id`
      : `cells->'${query.sort}' ${query.direction},id`;
  const page = exportAll ? 1 : query.page;
  const limit = exportAll ? Math.max(1, total) : 50;
  const rows = await db.query<{ id: string; cells: ReportRow }>(
    `SELECT id,cells FROM (${sql}) report ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, (page - 1) * 50],
  );
  return {
    columns,
    rows: rows.rows.map((row) => ({
      _id: row.id,
      ...Object.fromEntries(Object.keys(columns).map((key) => [key, row.cells[key] ?? ""])),
    })),
    total,
    page,
    hasNextPage: page * 50 < total,
    definition:
      query.dataset === "access"
        ? "Contagens por dia, tela, fonte e dispositivo. Visitantes e sessões podem se repetir entre linhas; não somar como pessoas."
        : `${query.dateScope === "all" ? "Todos os registros, sem restrição por data" : `${reportCatalog[query.dataset].dateLabel} dentro do período`}; demais campos representam a situação atual. Agendamentos são reservas, não atendimentos realizados.`,
  };
}
