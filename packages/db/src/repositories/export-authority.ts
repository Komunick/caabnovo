import type { Pool, PoolClient } from "pg";
import { readUserPermissions } from "./user-access";
type Connection = Pick<Pool | PoolClient, "query">;
function denied(): never {
  throw Object.assign(new Error("PERMISSION_DENIED"), { code: "PERMISSION_DENIED", status: 403 });
}
export async function currentExportOwner(db: Connection, userId: string, sessionId?: string) {
  const user = await db.query("SELECT id FROM \"user\" WHERE id=$1 AND status='active' FOR SHARE", [
    userId,
  ]);
  if (!user.rowCount) denied();
  if (sessionId !== undefined) {
    const session = await db.query(
      "SELECT id FROM session WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>clock_timestamp() FOR SHARE",
      [sessionId, userId],
    );
    if (!session.rowCount) denied();
  }
  return { userId, permissions: new Set(await readUserPermissions(db, userId)) };
}
