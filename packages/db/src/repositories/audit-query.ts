import type { Pool, PoolClient } from "pg";
import { redactSensitive } from "@caab/config/redaction";

type Queryable = Pick<Pool | PoolClient, "query">;

export interface AuditEventRecord {
  id: string;
  occurredAt: Date;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  origin: "web" | "worker" | "system";
  requestId: string;
  correlationId: string;
}

export interface AuditQuery {
  cursor?: string;
  limit: number;
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: Date;
  to?: Date;
}

export class InvalidAuditCursorError extends Error {
  readonly code = "INVALID_AUDIT_CURSOR";
  readonly status = 422;
}

interface AuditRow {
  id: string;
  occurred_at: Date;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  origin: "web" | "worker" | "system";
  request_id: string;
  correlation_id: string;
}

function encodeCursor(event: AuditEventRecord): string {
  return Buffer.from(JSON.stringify([event.occurredAt.toISOString(), event.id])).toString(
    "base64url",
  );
}

function decodeCursor(cursor: string): [Date, string] {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 2 ||
      typeof parsed[0] !== "string" ||
      Number.isNaN(Date.parse(parsed[0])) ||
      typeof parsed[1] !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(parsed[1])
    ) {
      throw new Error("Malformed cursor");
    }
    return [new Date(parsed[0]), parsed[1]];
  } catch {
    throw new InvalidAuditCursorError("Invalid audit cursor");
  }
}

function snapshot(value: Record<string, unknown> | null): Record<string, unknown> | null {
  return value ? (redactSensitive(value) as Record<string, unknown>) : null;
}

export async function listAuditEvents(
  db: Queryable,
  query: AuditQuery,
): Promise<{ items: AuditEventRecord[]; nextCursor: string | null }> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  const bind = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (query.actorId) conditions.push(`actor_user_id = ${bind(query.actorId)}`);
  if (query.action) conditions.push(`action = ${bind(query.action)}`);
  if (query.entityType) conditions.push(`entity_type = ${bind(query.entityType)}`);
  if (query.from) conditions.push(`occurred_at >= ${bind(query.from)}`);
  if (query.to) conditions.push(`occurred_at <= ${bind(query.to)}`);
  if (query.cursor) {
    const [occurredAt, id] = decodeCursor(query.cursor);
    const occurredAtParameter = bind(occurredAt);
    const idParameter = bind(id);
    conditions.push(`(occurred_at, id) < (${occurredAtParameter}, ${idParameter})`);
  }
  const limit = Math.max(1, Math.min(100, Math.trunc(query.limit)));
  const result = await db.query<AuditRow>(
    `SELECT id, occurred_at, actor_user_id, action, entity_type, entity_id,
       before, after, reason, origin, request_id, correlation_id
     FROM audit_event
     ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
     ORDER BY occurred_at DESC, id DESC
     LIMIT ${bind(limit + 1)}`,
    values,
  );
  const records = result.rows.map((row) => ({
    id: row.id,
    occurredAt: row.occurred_at,
    actorUserId: row.actor_user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    before: snapshot(row.before),
    after: snapshot(row.after),
    reason: row.reason,
    origin: row.origin,
    requestId: row.request_id,
    correlationId: row.correlation_id,
  }));
  const hasMore = records.length > limit;
  const items = records.slice(0, limit);
  return {
    items,
    nextCursor: hasMore && items.length ? encodeCursor(items.at(-1)!) : null,
  };
}
