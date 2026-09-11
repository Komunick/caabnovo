import type { Pool, PoolClient } from "pg";

/** Domain identity only: consumers apply their own eligibility/credit rules. */
export async function findMemberSummary(client: Pool | PoolClient, id: string) {
  const result = await client.query<{
    id: string;
    name: string;
    archived_at: Date | null;
    administrative_status: "inactive" | "active" | "blocked";
  }>("SELECT id,name,archived_at,administrative_status FROM member WHERE id=$1", [id]);
  const row = result.rows[0];
  return row
    ? {
        id: row.id,
        name: row.name,
        archivedAt: row.archived_at?.toISOString() ?? null,
        administrativeStatus: row.administrative_status,
      }
    : null;
}
