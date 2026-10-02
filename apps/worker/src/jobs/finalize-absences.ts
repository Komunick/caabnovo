import type { Pool } from "pg";
import type { PgBoss } from "pg-boss";
import { processExpiredSchedulingAbsences } from "@caab/db/repositories/scheduling-absence-finalization";
import { QUEUES } from "../queues.js";

export async function registerSchedulingAbsenceFinalization(
  boss: Pick<PgBoss, "work" | "schedule">,
  pool: Pool,
) {
  await boss.work(QUEUES.schedulingAbsenceFinalization, async () => {
    await processExpiredSchedulingAbsences(pool);
  });
  await boss.schedule(QUEUES.schedulingAbsenceFinalization, "* * * * *", {});
}
