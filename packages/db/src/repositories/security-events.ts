import type { PoolClient } from "pg";
import { redactSensitive } from "@caab/config/redaction";

export type SecurityEventOutcome = "success" | "failure" | "denied";

export interface SecurityEventInput {
  userId?: string;
  eventType: string;
  outcome: SecurityEventOutcome;
  reasonCode: string;
  requestId: string;
  correlationId: string;
  context?: Record<string, unknown>;
}

export async function writeSecurityEvent(
  client: PoolClient,
  event: SecurityEventInput,
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `INSERT INTO security_event
      (user_id, event_type, outcome, reason_code, request_id, correlation_id, context)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      event.userId ?? null,
      event.eventType,
      event.outcome,
      event.reasonCode,
      event.requestId,
      event.correlationId,
      redactSensitive(event.context ?? {}),
    ],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Security event was not persisted");
  return row.id;
}
