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
    const family =
      "AND ($2::uuid IS NULL OR EXISTS(SELECT 1 FROM member_relationship r WHERE r.holder_id=$2 AND r.dependent_id=member.id AND r.ended_at IS NULL AND r.starts_on<=(clock_timestamp() AT TIME ZONE 'America/Bahia')::date))";
    const total = Number(
      (
        await client.query(
          `SELECT count(*) AS total FROM member WHERE (deletion_effective_at IS NULL OR deletion_effective_at>clock_timestamp()) AND archived_at IS NULL AND name ILIKE $1 ${family}`,
          [search, query.holderId ?? null],
        )
      ).rows[0].total,
    );
    const items = (
      await client.query<SchedulingBeneficiary>(
        `SELECT id,name,extract(year FROM birth_date)::integer AS "birthYear",oab_number AS "oabNumber",oab_state AS "oabState"
      FROM member WHERE (deletion_effective_at IS NULL OR deletion_effective_at>clock_timestamp()) AND archived_at IS NULL AND name ILIKE $1 ${family} ORDER BY name,id LIMIT $3 OFFSET $4`,
        [search, query.holderId ?? null, query.pageSize, (query.page - 1) * query.pageSize],
      )
    ).rows;
    return { items, total, page: query.page, pageSize: query.pageSize };
  });
}
