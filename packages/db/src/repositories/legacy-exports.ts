import type { Pool, PoolClient } from "pg";
import { currentExportOwner } from "./export-authority";
export { currentExportOwner } from "./export-authority";
import { authorizeStoredExport, type StoredReportExport } from "./report-storage";

type Connection = Pick<Pool | PoolClient, "query">;
function denied(): never {
  throw Object.assign(new Error("PERMISSION_DENIED"), { code: "PERMISSION_DENIED", status: 403 });
}
export async function authorizeLegacyFile(
  db: Connection,
  actor: { userId: string; sessionId: string },
  file: { owner_type: string; owner_id: string; uploaded_by: string },
) {
  if (file.owner_type !== "audit_export" && file.owner_type !== "report_export") return;
  if (file.uploaded_by !== actor.userId) denied();
  const current = await currentExportOwner(db, actor.userId, actor.sessionId);
  if (file.owner_type === "audit_export") {
    if (!current.permissions.has("audit:read") || !current.permissions.has("exports:generate"))
      denied();
  } else {
    const record = await db.query<{ configuration: StoredReportExport }>(
      "SELECT configuration FROM report_export WHERE id=$1 AND owner_id=$2",
      [file.owner_id, actor.userId],
    );
    if (!record.rows[0]) denied();
    authorizeStoredExport(current, record.rows[0].configuration);
  }
}
