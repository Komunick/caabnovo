import "server-only";
import type { Pool } from "pg";
import {
  schedulingPageQuerySchema,
  type SchedulingBeneficiary,
  type SchedulingPage,
} from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import { schedulingAccess } from "./access";

export async function listSchedulingBeneficiaries(
  pool: Pool,
  actor: RequestActor,
  raw: unknown,
): Promise<SchedulingPage<SchedulingBeneficiary>> {
  const query = schedulingPageQuerySchema.parse(raw);
  return schedulingAccess(pool, actor, false, async (client) => {
    const search = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
    const total = Number(
      (
        await client.query(
          "SELECT count(*) AS total FROM member WHERE (deletion_effective_at IS NULL OR deletion_effective_at>clock_timestamp()) AND archived_at IS NULL AND name ILIKE $1",
          [search],
        )
      ).rows[0].total,
    );
    const items = (
      await client.query<SchedulingBeneficiary>(
        `SELECT id,name,extract(year FROM birth_date)::integer AS "birthYear",oab_number AS "oabNumber",oab_state AS "oabState"
      FROM member WHERE (deletion_effective_at IS NULL OR deletion_effective_at>clock_timestamp()) AND archived_at IS NULL AND name ILIKE $1 ORDER BY name,id LIMIT $2 OFFSET $3`,
        [search, query.pageSize, (query.page - 1) * query.pageSize],
      )
    ).rows;
    return { items, total, page: query.page, pageSize: query.pageSize };
  });
}
