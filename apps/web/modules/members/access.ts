import "server-only";
import type { PoolClient } from "pg";
import type { RequestActor } from "../shared/request-context";
import { PERMISSIONS, type Permission } from "../auth/permissions";

/** Re-read grants inside the transaction; a stale actor must not retain revoked access. */
export async function authorizeMemberAccess(
  client: PoolClient,
  actor: RequestActor,
  permission: Permission = PERMISSIONS.membersRead,
  filePermission?: Permission,
) {
  const session = await client.query(
    `SELECT u.id FROM "user" u JOIN session s ON s.user_id=u.id
     WHERE u.id=$1 AND s.id=$2 AND u.status='active' AND s.revoked_at IS NULL
       AND s.expires_at>now() FOR SHARE OF u,s`,
    [actor.userId, actor.sessionId],
  );
  if (!session.rows[0])
    throw Object.assign(new Error("AUTHENTICATION_REQUIRED"), {
      code: "AUTHENTICATION_REQUIRED",
      status: 401,
    });
  const grants = await client.query<{ permission: string }>(
    `SELECT p.resource || ':' || p.action AS permission
     FROM user_role ur JOIN role r ON r.id=ur.role_id
     JOIN role_permission rp ON rp.role_id=r.id JOIN permission p ON p.id=rp.permission_id
     WHERE ur.user_id=$1 AND ur.revoked_at IS NULL AND ur.valid_from<=now()
       AND (ur.valid_until IS NULL OR ur.valid_until>now()) AND r.status='active'
       AND r.deleted_at IS NULL FOR SHARE OF ur,r,rp,p`,
    [actor.userId],
  );
  const allowed = new Set(grants.rows.map((row) => row.permission));
  if (
    !allowed.has(PERMISSIONS.membersRead) ||
    !allowed.has(permission) ||
    (filePermission && !allowed.has(filePermission))
  ) {
    throw Object.assign(new Error("PERMISSION_DENIED"), { code: "PERMISSION_DENIED", status: 403 });
  }
  return allowed;
}
