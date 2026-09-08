import "server-only";
import type { Pool } from "pg";
import {
  listAuditEvents,
  type AuditQuery,
  type AuditEventRecord,
} from "@caab/db/repositories/audit-query";
import { requirePermission } from "../auth/authorize";
import { PERMISSIONS } from "../auth/permissions";
import type { RequestActor } from "../shared/request-context";

export function serializeAuditEvent(event: AuditEventRecord) {
  return {
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
  };
}

export async function searchAuditEvents(pool: Pool, actor: RequestActor, query: AuditQuery) {
  requirePermission(actor, PERMISSIONS.auditRead);
  const page = await listAuditEvents(pool, query);
  return {
    items: page.items.map(serializeAuditEvent),
    nextCursor: page.nextCursor,
  };
}
