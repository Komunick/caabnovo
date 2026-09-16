import type { Pool, PoolClient } from "pg";

/** Same lock for relationship/status changes and booking confirmation; take before row locks. */
export async function lockMemberEligibility(client: PoolClient): Promise<void> {
  await client.query("SELECT pg_advisory_xact_lock(5010,1)");
}

export async function findSchedulingBeneficiary(client: PoolClient, id: string) {
  const result = await client.query<{
    id: string;
    name: string;
    blocked: boolean;
    archived: boolean;
  }>(
    `WITH RECURSIVE holders(id) AS (
      SELECT $1::uuid UNION
      SELECT r.holder_id FROM member_relationship r JOIN holders h ON r.dependent_id=h.id
        WHERE r.ended_at IS NULL AND r.starts_on <= (clock_timestamp() AT TIME ZONE 'America/Bahia')::date
    ) SELECT m.id,m.name,m.archived_at IS NOT NULL AS archived,
      EXISTS(SELECT 1 FROM member a JOIN holders h ON h.id=a.id WHERE a.administrative_status='blocked') AS blocked
      FROM member m WHERE m.id=$1`,
    [id],
  );
  return result.rows[0] ?? null;
}

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
