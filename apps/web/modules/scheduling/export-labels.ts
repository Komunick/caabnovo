import "server-only";
import { z } from "zod";
import type { Pool } from "pg";
import type { RequestActor } from "../shared/request-context";
import { schedulingAccess } from "./access";

/** Resolve initial filter labels in one authorized read; never display UUIDs as selectors. */
export async function schedulingExportLabels(
  pool: Pool,
  actor: RequestActor,
  filters: Record<string, string>,
) {
  const entries = Object.entries(filters).filter(
    ([key, value]) =>
      ["memberId", "unitId", "professionalId", "serviceId", "procedureId"].includes(key) &&
      z.uuid().safeParse(value).success,
  );
  if (!entries.length) return {};
  return schedulingAccess(pool, actor, false, async (client) => {
    const rows = (
      await client.query<{ key: string; name: string }>(
        `WITH labels AS (
        SELECT 'memberId' AS key,id,name FROM member
        UNION ALL SELECT 'unitId',id,name FROM scheduling_unit
        UNION ALL SELECT 'professionalId',id,name FROM scheduling_professional
        UNION ALL SELECT 'serviceId',id,name FROM scheduling_service
        UNION ALL SELECT 'procedureId',id,name FROM scheduling_procedure
      ) SELECT l.key,l.name FROM labels l
      JOIN unnest($1::text[],$2::uuid[]) AS selected(key,id) ON selected.key=l.key AND selected.id=l.id`,
        [entries.map(([key]) => key), entries.map(([, value]) => value)],
      )
    ).rows;
    return Object.fromEntries(rows.map((row) => [row.key, row.name]));
  });
}
