import "server-only";
import type { PoolClient } from "pg";
import { readUserPermissions } from "@caab/db/repositories/user-access";
import { AuthenticationRequiredError, PermissionDeniedError } from "../auth/authorize";
import type { RequestActor } from "../shared/request-context";

export async function authorizeNewsFileAccess(
  client: PoolClient,
  actor: RequestActor,
  write: boolean,
) {
  const session = await client.query(
    `SELECT s.id FROM session s JOIN "user" u ON u.id=s.user_id
     WHERE s.id=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>now()
       AND u.status='active' FOR SHARE OF s,u`,
    [actor.sessionId, actor.userId],
  );
  if (!session.rows.length) throw new AuthenticationRequiredError("Authentication required");
  const allowed = new Set(await readUserPermissions(client, actor.userId));
  if (
    !allowed.has("news:read") ||
    !allowed.has(write ? "news:write" : "news:read") ||
    !allowed.has(write ? "files:create" : "files:read")
  )
    throw new PermissionDeniedError("Permission denied");
}
