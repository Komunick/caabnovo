import "server-only";
import { z } from "zod";
import type { Pool } from "pg";
import {
  idSchema,
  schedulingPageQuerySchema,
  schedulingBookingSchema,
  schedulingPolicySchema,
  type SchedulingBooking,
} from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import {
  schedulingAccess,
  schedulingReplay,
  SchedulingError,
  type SchedulingContext,
} from "./access";
import { bookingFrom, bookingSelect } from "./booking-service";
import { schedulingQueueSignals } from "./policy";
import { readCatalogItem, auditScheduling } from "./catalog-service";

export async function listSchedulingApprovalQueue(pool: Pool, actor: RequestActor, raw: unknown) {
  const query = schedulingPageQuerySchema.parse(raw);
  return schedulingAccess(pool, actor, false, async (client) => {
    const where =
      "WHERE b.status IN ('pending_approval','awaiting_new_time') AND ($1::uuid IS NULL OR u.id=$1) AND m.name ILIKE $2";
    const values = [query.unitId ?? null, `%${query.q.replace(/[\\%_]/g, "\\$&")}%`];
    const total = Number(
      (await client.query(`SELECT count(*) AS total ${bookingFrom} ${where}`, values)).rows[0]
        .total,
    );
    const rows = (
      await client.query<{ data: SchedulingBooking }>(
        `${bookingSelect} ${where}
      ORDER BY CASE WHEN b.process_id IS NOT NULL THEN 0 ELSE 1 END,b.original_start ASC NULLS LAST,
      coalesce(b.entered_review_at,b.created_at),b.id LIMIT $3 OFFSET $4`,
        [...values, query.pageSize, (query.page - 1) * query.pageSize],
      )
    ).rows;
    const ids = [...new Set(rows.map((row) => row.data.serviceId))];
    const policies = (
      await client.query<{ id: string; policy: unknown }>(
        "SELECT id,coalesce(published_revision->'policy',policy) AS policy FROM scheduling_service WHERE id=ANY($1::uuid[])",
        [ids],
      )
    ).rows;
    const teams = (
      await client.query<{ unit_id: string }>(
        "SELECT unit_id FROM scheduling_unit_team WHERE user_id=$1",
        [actor.userId],
      )
    ).rows;
    const now = (
      await client.query<{ now: Date }>("SELECT clock_timestamp() AS now")
    ).rows[0]!.now.getTime();
    const items = rows.map((row) => {
      const booking = schedulingBookingSchema.parse(row.data);
      const policy = schedulingPolicySchema.parse(
        policies.find((p) => p.id === booking.serviceId)!.policy,
      );
      const signals =
        booking.enteredReviewAt && booking.startsAt
          ? schedulingQueueSignals(
              policy,
              Date.parse(booking.enteredReviewAt),
              Date.parse(booking.startsAt),
              now,
            )
          : { ageHours: 0, overdue: false, urgent: false };
      return {
        ...booking,
        ...signals,
        teamRole: teams.some((t) => t.unit_id === booking.unitId) ? "primary" : "backup",
      };
    });
    return { items, total, page: query.page, pageSize: query.pageSize };
  });
}

export async function getSchedulingTeam(pool: Pool, actor: RequestActor, id: string) {
  idSchema.parse(id);
  return schedulingAccess(pool, actor, false, async (client) => {
    const unit = await readCatalogItem(client, "units", id);
    const items = (
      await client.query<{ id: string; name: string }>(
        `SELECT u.id,u.name FROM scheduling_unit_team t JOIN "user" u ON u.id=t.user_id WHERE t.unit_id=$1 ORDER BY u.name,u.id`,
        [id],
      )
    ).rows;
    return { version: unit.version, items };
  });
}
export async function listSchedulingTeamCandidates(pool: Pool, actor: RequestActor, raw: unknown) {
  const query = schedulingPageQuerySchema.parse(raw);
  return schedulingAccess(pool, actor, false, async (client) => {
    const where = `FROM "user" u WHERE u.status='active' AND u.name ILIKE $1
      AND EXISTS(SELECT 1 FROM effective_user_permission WHERE user_id=u.id AND permission='scheduling:read')
      AND EXISTS(SELECT 1 FROM effective_user_permission WHERE user_id=u.id AND permission='scheduling:write')`;
    const q = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
    const items = (
      await client.query<{ id: string; name: string }>(
        `SELECT u.id,u.name ${where} ORDER BY u.name,u.id LIMIT $2 OFFSET $3`,
        [q, query.pageSize, (query.page - 1) * query.pageSize],
      )
    ).rows;
    const total = Number(
      (await client.query(`SELECT count(*) AS total ${where}`, [q])).rows[0].total,
    );
    return { items, total, page: query.page, pageSize: query.pageSize };
  });
}
export async function saveSchedulingTeam(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = z
    .object({ expectedVersion: z.number().int().positive(), userIds: z.array(idSchema).max(100) })
    .strict()
    .parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `unit:${id}:team`, input, async () => {
      const unit = await readCatalogItem(client, "units", id);
      if (unit.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      for (const userId of new Set(input.userIds)) {
        if (
          !(
            await client.query(
              `SELECT 1 FROM "user" u WHERE id=$1 AND status='active'
        AND EXISTS(SELECT 1 FROM effective_user_permission WHERE user_id=u.id AND permission='scheduling:read')
        AND EXISTS(SELECT 1 FROM effective_user_permission WHERE user_id=u.id AND permission='scheduling:write')`,
              [userId],
            )
          ).rowCount
        )
          throw new SchedulingError("SCHEDULING_TEAM_ACCESS", 422);
      }
      await client.query("DELETE FROM scheduling_unit_team WHERE unit_id=$1", [id]);
      for (const userId of new Set(input.userIds))
        await client.query("INSERT INTO scheduling_unit_team(unit_id,user_id) VALUES($1,$2)", [
          id,
          userId,
        ]);
      await client.query("UPDATE scheduling_unit SET version=version+1 WHERE id=$1", [id]);
      await auditScheduling(
        client,
        context,
        "scheduling.team.updated",
        "scheduling_unit",
        id,
        undefined,
        { userIds: input.userIds },
      );
      return { version: unit.version + 1 };
    }),
  );
}
