import { createHmac } from "node:crypto";
import type { Pool } from "pg";
import { withTransaction } from "../client";
import {
  analyticsEventSchema,
  reportBounds,
  type ReportQuery,
  type ReportUsage,
} from "@caab/contracts";
import { reportError, type ReportDb } from "./reports";
export async function collectReportEvent(
  pool: Pool,
  input: unknown,
  context: {
    source: string;
    channel: "admin" | "site" | "app";
    environment: "production" | "development" | "test";
    secret: string;
    accountId?: string;
  },
) {
  const event = analyticsEventSchema.parse(input);
  const now = new Date(),
    occurredAt = event.occurredAt ? new Date(event.occurredAt) : now;
  if (
    occurredAt.valueOf() > now.valueOf() + 60000 ||
    occurredAt.valueOf() < now.valueOf() - 7 * 86400000
  )
    throw reportError("INVALID_EVENT_TIME", 422);
  if (context.secret.length < 32) throw reportError("COLLECTION_NOT_CONFIGURED", 422);
  const hash = (kind: string, value: string) =>
    createHmac("sha256", context.secret)
      .update(`${context.environment}:${context.source}:${kind}:${value}`)
      .digest("hex");
  const accountId = context.accountId ?? event.accountId;
  const visitor = hash(
    "visitor",
    context.channel === "admin" && accountId ? accountId : event.visitorId,
  );
  return withTransaction(pool, async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `analytics:${context.source}:${visitor}`,
    ]);
    const count = await db.query<{ total: string }>(
      "SELECT count(*)::text AS total FROM analytics_event WHERE source=$1 AND visitor_hash=$2 AND received_at>now()-interval '1 minute'",
      [context.source, visitor],
    );
    if (Number(count.rows[0]!.total) >= 120) throw reportError("COLLECTION_RATE_LIMIT", 422);
    await db.query(
      `INSERT INTO analytics_event(id,source,channel,environment,event,screen,visitor_hash,session_hash,account_hash,device,origin,app_version,occurred_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT(source,id) DO NOTHING`,
      [
        event.id,
        context.source,
        context.channel,
        context.environment,
        event.event,
        event.screen,
        visitor,
        hash("session", `${accountId ?? event.visitorId}:${event.sessionId}`),
        accountId ? hash("account", accountId) : null,
        event.device,
        event.origin,
        event.version,
        occurredAt,
      ],
    );
  });
}
export async function reportUsage(db: ReportDb, query: ReportQuery): Promise<ReportUsage> {
  const { from, until, previousFrom } = reportBounds(query);
  const values = [query.environment, query.channel, query.source, from, until];
  const where = "environment=$1 AND ($2='all' OR channel=$2) AND ($3='' OR source=$3)";
  const result = await db.query<Record<string, string | null>>(
    `SELECT
    count(*) FILTER(WHERE event='page_view')::text AS views,count(DISTINCT session_hash)::text AS sessions,
    count(DISTINCT visitor_hash)::text AS visitors,count(DISTINCT account_hash)::text AS accounts
    FROM analytics_event WHERE ${where} AND occurred_at >= $4 AND occurred_at < $5`,
    values,
  );
  const previous = (
    await db.query<Record<string, string>>(
      `SELECT count(*) FILTER(WHERE event='page_view')::text AS views,count(DISTINCT session_hash)::text AS sessions,count(DISTINCT visitor_hash)::text AS visitors,count(DISTINCT account_hash)::text AS accounts FROM analytics_event WHERE ${where} AND occurred_at >= $4 AND occurred_at < $5`,
      [...values.slice(0, 3), previousFrom, from],
    )
  ).rows[0]!;
  const series = await db.query<{ date: string; views: string }>(
    `SELECT to_char(occurred_at AT TIME ZONE 'America/Bahia','YYYY-MM') AS date,count(*)::text AS views FROM analytics_event WHERE ${where} AND occurred_at >= $4 AND occurred_at < $5 AND event='page_view' GROUP BY 1 ORDER BY 1`,
    values,
  );
  const coverage = await db.query<{
    source: string;
    channel: string;
    first_event: Date;
    last_event: Date;
    events: string;
  }>(
    `SELECT source,channel,min(occurred_at) AS first_event,max(occurred_at) AS last_event,count(*)::text AS events FROM analytics_event WHERE ${where} GROUP BY source,channel ORDER BY source`,
    values.slice(0, 3),
  );
  const live = await db.query<Record<string, string>>(
    `SELECT count(DISTINCT session_hash) FILTER(WHERE occurred_at>now()-interval '5 minutes')::text AS recent,
    count(DISTINCT account_hash) FILTER(WHERE occurred_at >= $4::timestamptz-interval '1 day' AND occurred_at < $4)::text AS daily,
    count(DISTINCT account_hash) FILTER(WHERE occurred_at >= $4::timestamptz-interval '7 days' AND occurred_at < $4)::text AS weekly,
    count(DISTINCT account_hash) FILTER(WHERE occurred_at >= $4::timestamptz-interval '30 days' AND occurred_at < $4)::text AS monthly
    FROM analytics_event WHERE ${where}`,
    [...values.slice(0, 3), until],
  );
  const returning = await db.query<{ total: string }>(
    `SELECT count(DISTINCT e.visitor_hash)::text AS total FROM analytics_event e WHERE ${where} AND occurred_at >= $4 AND occurred_at < $5 AND EXISTS(SELECT 1 FROM analytics_event old WHERE old.environment=e.environment AND old.source=e.source AND old.visitor_hash=e.visitor_hash AND old.occurred_at<$4)`,
    values,
  );
  // Ordered same-session funnel. A later event alone never fabricates the preceding steps.
  const funnel = await db.query<{
    opened: string;
    service: string;
    slot: string;
    confirmed: string;
  }>(
    `WITH opened AS (SELECT session_hash,min(occurred_at) AS at FROM analytics_event WHERE ${where} AND occurred_at >= $4 AND occurred_at < $5 AND event='schedule_open' GROUP BY session_hash), service AS (SELECT o.session_hash,min(e.occurred_at) AS at FROM opened o JOIN analytics_event e ON e.session_hash=o.session_hash AND e.occurred_at>=o.at AND e.occurred_at<$5 AND e.event='service_selected' GROUP BY o.session_hash), slot AS (SELECT s.session_hash,min(e.occurred_at) AS at FROM service s JOIN analytics_event e ON e.session_hash=s.session_hash AND e.occurred_at>=s.at AND e.occurred_at<$5 AND e.event='slot_selected' GROUP BY s.session_hash), confirmed AS (SELECT s.session_hash FROM slot s JOIN analytics_event e ON e.session_hash=s.session_hash AND e.occurred_at>=s.at AND e.occurred_at<$5 AND e.event='booking_confirmed' GROUP BY s.session_hash) SELECT (SELECT count(*) FROM opened)::text AS opened,(SELECT count(*) FROM service)::text AS service,(SELECT count(*) FROM slot)::text AS slot,(SELECT count(*) FROM confirmed)::text AS confirmed`,
    values,
  );
  const row = result.rows[0]!,
    active = live.rows[0]!,
    steps = funnel.rows[0]!;
  const first = coverage.rows.map((r) => r.first_event.toISOString()).sort()[0] ?? null;
  const last =
    coverage.rows
      .map((r) => r.last_event.toISOString())
      .sort()
      .at(-1) ?? null;
  return {
    previous: {
      views: Number(previous.views),
      sessions: Number(previous.sessions),
      visitors: Number(previous.visitors),
      accounts: Number(previous.accounts),
    },
    series: series.rows.map((point) => ({ date: point.date, views: Number(point.views) })),
    views: Number(row.views),
    sessions: Number(row.sessions),
    visitors: Number(row.visitors),
    accounts: Number(row.accounts),
    returning: Number(returning.rows[0]!.total),
    recent: Number(active.recent),
    daily: Number(active.daily),
    weekly: Number(active.weekly),
    monthly: Number(active.monthly),
    firstEvent: first,
    lastEvent: last,
    sources: coverage.rows.map((r) => ({
      source: r.source,
      channel: r.channel,
      firstEvent: r.first_event.toISOString(),
      lastEvent: r.last_event.toISOString(),
      events: Number(r.events),
    })),
    funnel: [
      { step: "Abriu Agendamentos", sessions: Number(steps.opened) },
      { step: "Selecionou serviço", sessions: Number(steps.service) },
      { step: "Selecionou horário", sessions: Number(steps.slot) },
      { step: "Confirmou reserva", sessions: Number(steps.confirmed) },
    ],
  };
}
