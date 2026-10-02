import "server-only";
import type { Pool, PoolClient } from "pg";
import { schedulingAvailabilitySchema } from "@caab/contracts";
import { findSchedulingBeneficiary } from "@caab/db/repositories/members";
import type { RequestActor } from "../shared/request-context";
import { schedulingAccess, SchedulingError } from "./access";
import { buildSlots, schedulingTimezone } from "./availability";
import { getWorkflowAvailability } from "./workflow-availability";
import { procedureActiveSql, serviceActiveSql } from "./offer-sql";

export async function readSchedulingSlots(
  client: PoolClient,
  assignmentId: string,
  date: string,
  excludeBookingId?: string,
  beneficiaryId?: string,
) {
  const assignment = (
    await client.query<{
      professional_id: string;
      unit_id: string;
      duration_minutes: number;
      active: boolean;
    }>(
      `SELECT a.professional_id,a.unit_id,coalesce((SELECT (item->>'durationMinutes')::int FROM jsonb_array_elements(s.published_revision->'procedures') item WHERE item->>'id'=p.id::text),p.duration_minutes) AS duration_minutes,(a.active AND u.active AND ${procedureActiveSql()} AND ${serviceActiveSql()} AND f.active) AS active
     FROM scheduling_assignment a JOIN scheduling_procedure p ON p.id=a.procedure_id JOIN scheduling_service s ON s.id=p.service_id
     JOIN scheduling_unit u ON u.id=a.unit_id JOIN scheduling_professional f ON f.id=a.professional_id WHERE a.id=$1`,
      [assignmentId],
    )
  ).rows[0];
  if (!assignment) throw new SchedulingError("SCHEDULING_NOT_FOUND", 404);
  if (!assignment.active) throw new SchedulingError("SCHEDULING_OFFER_UNAVAILABLE", 422);
  const hours = (
    await client.query<{ start: Date; end: Date; lunchStart: Date | null; lunchEnd: Date | null }>(
      `SELECT ($3::date + greatest(u.start_local,p.start_local)) AT TIME ZONE 'America/Bahia' AS start,
      ($3::date + least(u.end_local,p.end_local)) AT TIME ZONE 'America/Bahia' AS end,
      ($3::date + p.lunch_start) AT TIME ZONE 'America/Bahia' AS "lunchStart",
      ($3::date + p.lunch_end) AT TIME ZONE 'America/Bahia' AS "lunchEnd"
    FROM scheduling_unit_hours u JOIN scheduling_professional_hours p ON p.unit_id=u.unit_id AND p.weekday=u.weekday
    WHERE u.unit_id=$1 AND p.professional_id=$2 AND u.weekday=extract(dow FROM $3::date)`,
      [assignment.unit_id, assignment.professional_id, date],
    )
  ).rows[0];
  if (!hours)
    return {
      items: [],
      timezone: schedulingTimezone,
      durationMinutes: assignment.duration_minutes,
      professionalId: assignment.professional_id,
    };
  const busy = (
    await client.query<{ starts_at: Date; ends_at: Date }>(
      `SELECT starts_at,ends_at FROM scheduling_booking WHERE (professional_id=$1 OR member_id=$4::uuid) AND status IN ('scheduled','pending_approval')
    AND ($3::uuid IS NULL OR id<>$3) AND starts_at < (($2::date + 1)::timestamp AT TIME ZONE 'America/Bahia')
    AND ends_at > ($2::date::timestamp AT TIME ZONE 'America/Bahia')`,
      [assignment.professional_id, date, excludeBookingId ?? null, beneficiaryId ?? null],
    )
  ).rows;
  const items = buildSlots(
    {
      start: hours.start.getTime(),
      end: hours.end.getTime(),
      lunchStart: hours.lunchStart?.getTime() ?? null,
      lunchEnd: hours.lunchEnd?.getTime() ?? null,
    },
    assignment.duration_minutes,
    busy.map((row) => ({ start: row.starts_at.getTime(), end: row.ends_at.getTime() })),
    Date.now(),
  );
  return {
    items,
    timezone: schedulingTimezone,
    durationMinutes: assignment.duration_minutes,
    professionalId: assignment.professional_id,
  };
}
export async function getSchedulingAvailability(pool: Pool, actor: RequestActor, raw: unknown) {
  const query = schedulingAvailabilitySchema.parse(raw);
  return schedulingAccess(pool, actor, false, async (client) => {
    let beneficiaryId = query.beneficiaryId;
    if (query.excludeBookingId) {
      const excluded = (
        await client.query<{ member_id: string; status: string; process_kind: string | null }>(
          "SELECT member_id,status,process_kind FROM scheduling_booking WHERE id=$1",
          [query.excludeBookingId],
        )
      ).rows[0];
      if (!excluded) throw new SchedulingError("SCHEDULING_INVALID_REFERENCE", 422);
      if (beneficiaryId && excluded.member_id !== beneficiaryId) {
        const allowed =
          excluded.status === "pending_approval" &&
          !excluded.process_kind &&
          (
            await client.query(
              "SELECT 1 FROM member_relationship WHERE holder_id=$1 AND dependent_id=$2 AND ended_at IS NULL AND starts_on<=(clock_timestamp() AT TIME ZONE 'America/Bahia')::date",
              [excluded.member_id, beneficiaryId],
            )
          ).rowCount;
        if (!allowed) throw new SchedulingError("SCHEDULING_INVALID_REFERENCE", 422);
      }
      beneficiaryId ??= excluded.member_id;
    }
    if (beneficiaryId) {
      const member = await findSchedulingBeneficiary(client, beneficiaryId);
      if (!member) throw new SchedulingError("SCHEDULING_BENEFICIARY_NOT_FOUND", 404);
      if (member.deleted) throw new SchedulingError("SCHEDULING_BENEFICIARY_DELETED", 422);
      if (member.archived || member.blocked)
        throw new SchedulingError("SCHEDULING_BENEFICIARY_BLOCKED", 422);
    }
    const result = await getWorkflowAvailability(client, { ...query, beneficiaryId });
    return {
      items: result.items,
      timezone: result.timezone,
      durationMinutes: result.durationMinutes,
    };
  });
}
