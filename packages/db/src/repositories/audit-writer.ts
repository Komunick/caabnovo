import type { PoolClient } from "pg";
import { redactSensitive } from "@caab/config/redaction";

export interface AuditEventInput {
  actorUserId?: string;
  effectiveIdentity: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  origin: "web" | "worker" | "system";
  requestId: string;
  correlationId: string;
  ipHash?: string;
}

export async function writeAuditEvent(client: PoolClient, event: AuditEventInput): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO audit_event (
      actor_user_id, effective_identity, action, entity_type, entity_id, before, after,
      reason, origin, request_id, correlation_id, ip_hash
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [
      event.actorUserId ?? null,
      event.effectiveIdentity,
      event.action,
      event.entityType,
      event.entityId,
      event.before ? redactSensitive(event.before) : null,
      event.after ? redactSensitive(event.after) : null,
      event.reason?.trim() || null,
      event.origin,
      event.requestId,
      event.correlationId,
      event.ipHash ?? null,
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Audit event was not persisted");
  return row.id;
}
