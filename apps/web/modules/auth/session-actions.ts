import "server-only";
import type { Pool } from "pg";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { writeSecurityEvent } from "@caab/db/repositories/security-events";
import type { RequestActor } from "../shared/request-context";
import { requirePermission } from "./authorize";
import { getAuth } from "./auth";
import { PERMISSIONS } from "./permissions";

export function logoutCurrentSession(request: Request): Promise<Response> {
  return getAuth().handler(
    new Request(new URL("/api/auth/sign-out", request.url), {
      method: "POST",
      headers: request.headers,
    }),
  );
}

export async function revokeUserSessions(
  pool: Pool,
  actor: RequestActor,
  targetUserId: string,
  justification: string,
  metadata: { requestId: string; correlationId: string },
): Promise<number> {
  requirePermission(actor, PERMISSIONS.rolesRevoke);
  if (!justification.trim()) throw new Error("A justification is required");

  return withTransaction(pool, async (client) => {
    const result = await client.query(
      "UPDATE session SET revoked_at = now(), updated_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
      [targetUserId],
    );
    await writeSecurityEvent(client, {
      userId: targetUserId,
      eventType: "session.revoked",
      outcome: "success",
      reasonCode: "ADMINISTRATIVE_REVOCATION",
      ...metadata,
      context: { actorUserId: actor.userId, revokedCount: result.rowCount ?? 0 },
    });
    await writeAuditEvent(client, {
      actorUserId: actor.userId,
      effectiveIdentity: actor.userId,
      action: "session.revoke",
      entityType: "user",
      entityId: targetUserId,
      after: { activeSessions: 0 },
      reason: justification.trim(),
      origin: "web",
      ...metadata,
    });
    return result.rowCount ?? 0;
  });
}
