import "server-only";
import type { PoolClient } from "pg";
import { SchedulingError } from "./access";

/** Call inside the scheduling eligibility transaction/lock; attendance of existing bookings does not use this guard. */
export async function requireNoActiveSchedulingAbsence(client: PoolClient, memberId: string) {
  const active = await client.query(
    `SELECT 1 FROM scheduling_absence a LEFT JOIN scheduling_absence_appeal p ON p.absence_id=a.id
    WHERE a.member_id=$1 AND a.recorded_at<=clock_timestamp() AND a.restriction_ends_at>clock_timestamp()
    AND p.outcome IS DISTINCT FROM 'accepted' LIMIT 1`,
    [memberId],
  );
  if (active.rowCount) throw new SchedulingError("SCHEDULING_ABSENCE_RESTRICTED", 422);
}
