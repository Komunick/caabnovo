import "server-only";
import type { Pool } from "pg";
import type { RequestActor } from "../shared/request-context";

interface SessionRow {
  user_id: string;
  session_id: string;
  permissions: string[] | null;
}

export async function loadActiveSession(pool: Pool, token: string): Promise<RequestActor | null> {
  const result = await pool.query<SessionRow>(
    `SELECT u.id AS user_id, s.id AS session_id,
      array_remove(array_agg(DISTINCT p.permission), NULL) AS permissions
     FROM session s
     JOIN "user" u ON u.id = s.user_id
     LEFT JOIN effective_user_permission p ON p.user_id = u.id
     WHERE s.token = $1 AND s.revoked_at IS NULL AND s.expires_at > now()
       AND u.status = 'active'
     GROUP BY u.id, s.id`,
    [token],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    sessionId: row.session_id,
    permissions: new Set(row.permissions ?? []),
  };
}
