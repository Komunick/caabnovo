import "server-only";
import type { PoolClient } from "pg";
import type { RequestActor } from "../shared/request-context";
import { PERMISSIONS, type Permission } from "../auth/permissions";

/** Re-read grants inside the transaction; a stale actor must not retain revoked access. */
export async function authorizePartnerAccess(
  client: PoolClient,
  actor: RequestActor,
  permission: Permission = PERMISSIONS.partnersRead,
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
    "SELECT permission FROM effective_user_permission WHERE user_id=$1",
    [actor.userId],
  );
  const allowed = new Set(grants.rows.map((row) => row.permission));
  if (
    !allowed.has(PERMISSIONS.partnersRead) ||
    !allowed.has(permission) ||
    (filePermission && !allowed.has(filePermission))
  ) {
    throw Object.assign(new Error("PERMISSION_DENIED"), { code: "PERMISSION_DENIED", status: 403 });
  }
  return allowed;
}

export async function authorizePartnerUpload(client: PoolClient, actor: RequestActor, id: string) {
  await authorizePartnerAccess(client, actor, PERMISSIONS.partnersWrite, PERMISSIONS.filesCreate);
  const owner = await client.query(
    "SELECT id FROM partner WHERE id=$1 AND archived_at IS NULL FOR SHARE",
    [id],
  );
  if (!owner.rowCount)
    throw Object.assign(new Error("PARTNER_NOT_FOUND"), { code: "PARTNER_NOT_FOUND", status: 404 });
}
