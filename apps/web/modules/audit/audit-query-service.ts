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
import { findAuditUserNames, findAuditRoleNames } from "@caab/db/repositories/audit-names";
import { presentAuditEvent } from "./audit-presentation";

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
  const isId = (value: unknown): value is string =>
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  const userIds = [
    ...new Set(
      page.items
        .flatMap((event) => [
          event.actorUserId,
          event.entityType === "user" ? event.entityId : null,
        ])
        .filter(isId),
    ),
  ];
  const roleId = (event: AuditEventRecord) => event.after?.roleId ?? event.before?.roleId;
  const roleIds = [...new Set(page.items.map(roleId).filter(isId))];
  const users = actor.permissions.has(PERMISSIONS.usersRead)
    ? await findAuditUserNames(pool, userIds)
    : new Map<string, string>();
  const roles = actor.permissions.has(PERMISSIONS.rolesRead)
    ? await findAuditRoleNames(pool, roleIds)
    : new Map<string, string>();
  return {
    items: page.items.map((event) => ({
      ...serializeAuditEvent(event),
      presentation: presentAuditEvent(event, {
        actorName: event.actorUserId ? users.get(event.actorUserId) : undefined,
        targetName: event.entityType === "user" ? users.get(event.entityId) : undefined,
        roleName: isId(roleId(event)) ? roles.get(roleId(event) as string) : undefined,
      }),
    })),
    nextCursor: page.nextCursor,
  };
}
