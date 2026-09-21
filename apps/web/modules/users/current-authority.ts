import "server-only";
import type { PoolClient } from "pg";
import { readUserPermissions } from "@caab/db/repositories/user-access";
import { readRoleBase } from "@caab/db/repositories/user-roles";
import type { RequestActor } from "../shared/request-context";
import { AuthenticationRequiredError, requirePermission } from "../auth/authorize";
import type { Permission } from "../auth/permissions";

/** Re-read authority after the same locks used by role/access revocation. */
export async function currentAuthority(
  db: PoolClient,
  actor: RequestActor,
  permission: Permission,
  target?: string,
) {
  await db.query("SELECT pg_advisory_xact_lock(hashtext('caab:last-administrator'))");
  await db.query('SELECT id FROM "user" WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [
    [actor.userId, ...(target ? [target] : [])],
  ]);
  const session = await db.query(
    `SELECT s.id FROM session s JOIN "user" u ON u.id=s.user_id
    WHERE s.id=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>clock_timestamp()
    AND u.status='active' FOR SHARE OF s`,
    [actor.sessionId, actor.userId],
  );
  if (!session.rowCount) throw new AuthenticationRequiredError("AUTHENTICATION_REQUIRED");
  const current = { ...actor, permissions: new Set(await readUserPermissions(db, actor.userId)) };
  requirePermission(current, permission);
  if (
    ["roles:grant", "roles:revoke"].includes(permission) &&
    !(await readRoleBase(db, actor.userId)).administrator
  ) {
    throw Object.assign(new Error("PERMISSION_DENIED"), { code: "PERMISSION_DENIED", status: 403 });
  }
  return current;
}
