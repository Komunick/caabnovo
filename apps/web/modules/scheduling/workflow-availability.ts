import "server-only";
import type { PoolClient } from "pg";
import { schedulingPolicySchema, type SchedulingSlot } from "@caab/contracts";
import { findSchedulingBeneficiary } from "@caab/db/repositories/members";
import { SchedulingError } from "./access";
import { buildSlots, schedulingTimezone } from "./availability";
import { readSchedulingSlots } from "./availability-service";
import { procedureActiveSql, serviceActiveSql } from "./offer-sql";
import { validateSchedulingTime, type SchedulingTimeOperation } from "./policy";

export async function schedulingOffer(
  client: PoolClient,
  assignmentId?: string,
  procedureId?: string,
) {
  const row = (
    await client.query<{
      id: string;
      service_id: string;
      unit_id: string;
      duration_minutes: number;
      active: boolean;
      policy: unknown;
      published_revision: { procedures: Array<{ id: string; durationMinutes: number }> } | null;
    }>(
      `SELECT p.id,p.service_id,p.unit_id,p.duration_minutes,(${procedureActiveSql()} AND ${serviceActiveSql()} AND u.active) AS active,
     coalesce(s.published_revision->'policy',s.policy) AS policy,s.published_revision
     FROM scheduling_procedure p JOIN scheduling_service s ON s.id=p.service_id JOIN scheduling_unit u ON u.id=p.unit_id
     WHERE p.id=coalesce($2::uuid,(SELECT procedure_id FROM scheduling_assignment WHERE id=$1::uuid))`,
      [assignmentId ?? null, procedureId ?? null],
    )
  ).rows[0];
  if (!row) throw new SchedulingError("SCHEDULING_NOT_FOUND", 404);
  if (!row.active) throw new SchedulingError("SCHEDULING_OFFER_UNAVAILABLE", 422);
  if (
    assignmentId &&
    !(
      await client.query("SELECT 1 FROM scheduling_assignment WHERE id=$1 AND procedure_id=$2", [
        assignmentId,
        row.id,
      ])
    ).rowCount
  )
    throw new SchedulingError("SCHEDULING_INVALID_REFERENCE", 422);
  const published = row.published_revision?.procedures.find((p) => p.id === row.id);
  if (row.published_revision && !published)
    throw new SchedulingError("SCHEDULING_OFFER_UNAVAILABLE", 422);
  return {
    ...row,
    duration_minutes: published?.durationMinutes ?? row.duration_minutes,
    policy: schedulingPolicySchema.parse(row.policy),
  };
}
export async function requireSchedulingBeneficiary(
  client: PoolClient,
  memberId: string,
  audience: "all" | "holders" = "all",
) {
  const member = await findSchedulingBeneficiary(client, memberId);
  if (!member) throw new SchedulingError("SCHEDULING_BENEFICIARY_NOT_FOUND", 404);
  if (member.deleted) throw new SchedulingError("SCHEDULING_BENEFICIARY_DELETED", 422);
  if (member.archived || member.blocked)
    throw new SchedulingError("SCHEDULING_BENEFICIARY_BLOCKED", 422);
  if (
    audience === "holders" &&
    (
      await client.query(
        `SELECT 1 FROM member_relationship WHERE dependent_id=$1 AND ended_at IS NULL
    AND starts_on <= (clock_timestamp() AT TIME ZONE 'America/Bahia')::date LIMIT 1`,
        [memberId],
      )
    ).rowCount
  )
    throw new SchedulingError("SCHEDULING_AUDIENCE", 422);
}
type SlotQuery = {
  assignmentId?: string;
  procedureId?: string;
  date: string;
  excludeBookingId?: string;
  beneficiaryId?: string;
};
export async function getWorkflowAvailability(
  client: PoolClient,
  query: SlotQuery,
  operation?: SchedulingTimeOperation,
  originalStart?: number,
) {
  const offer = await schedulingOffer(client, query.assignmentId, query.procedureId);
  if (query.beneficiaryId)
    await requireSchedulingBeneficiary(client, query.beneficiaryId, offer.policy.audience);
  if (!operation && query.excludeBookingId) {
    const booking = (
      await client.query<{
        status: string;
        process_kind: string | null;
        starts_at: Date | null;
        original_start: Date | null;
      }>(
        "SELECT status,process_kind,starts_at,original_start FROM scheduling_booking WHERE id=$1",
        [query.excludeBookingId],
      )
    ).rows[0];
    if (!booking) throw new SchedulingError("SCHEDULING_NOT_FOUND", 404);
    operation =
      booking.status === "awaiting_new_time"
        ? "resume"
        : booking.process_kind === "recovery"
          ? "recovery"
          : booking.status === "scheduled" || booking.process_kind === "voluntary"
            ? "reschedule"
            : "new";
    originalStart = (booking.original_start ?? booking.starts_at)?.getTime();
  }
  operation ??= "new";
  const now = (
    await client.query<{ now: Date }>("SELECT clock_timestamp() AS now")
  ).rows[0]!.now.getTime();
  const items: SchedulingSlot[] = [];
  if (offer.policy.mode === "professional") {
    const resources = (
      await client.query<{ id: string; professional_id: string; name: string }>(
        `SELECT a.id,a.professional_id,f.name FROM scheduling_assignment a JOIN scheduling_professional f ON f.id=a.professional_id
       WHERE a.procedure_id=$1 AND a.active AND f.active AND ($2::uuid IS NULL OR a.id=$2) ORDER BY a.id`,
        [offer.id, offer.policy.allowProfessionalChoice ? (query.assignmentId ?? null) : null],
      )
    ).rows;
    for (const resource of resources) {
      const slots = await readSchedulingSlots(
        client,
        resource.id,
        query.date,
        query.excludeBookingId,
        query.beneficiaryId,
      );
      const blocks = (
        await client.query<{ starts_at: Date; ends_at: Date }>(
          "SELECT starts_at,ends_at FROM scheduling_resource_block WHERE professional_id=$1 OR (professional_id IS NULL AND service_id=$2)",
          [resource.professional_id, offer.service_id],
        )
      ).rows;
      for (const slot of slots.items) {
        if (
          blocks.some(
            (b) =>
              b.starts_at.getTime() < Date.parse(slot.endsAt) &&
              b.ends_at.getTime() > Date.parse(slot.startsAt),
          )
        )
          continue;
        if (!items.some((item) => item.startsAt === slot.startsAt))
          items.push({ ...slot, assignmentId: resource.id, professionalName: resource.name });
      }
    }
  } else {
    if (query.assignmentId) throw new SchedulingError("SCHEDULING_INVALID_REFERENCE", 422);
    const hours = (
      await client.query<{ start: Date; end: Date }>(
        `SELECT ($3::date+greatest(u.start_local,h.start_local)) AT TIME ZONE 'America/Bahia' AS start,
       ($3::date+least(u.end_local,h.end_local)) AT TIME ZONE 'America/Bahia' AS end
       FROM scheduling_service_hours h JOIN scheduling_unit_hours u ON u.unit_id=$2 AND u.weekday=h.weekday
       WHERE h.service_id=$1 AND h.weekday=extract(dow FROM $3::date)`,
        [offer.service_id, offer.unit_id, query.date],
      )
    ).rows[0];
    if (hours) {
      const busy = (
        await client.query<{
          starts_at: Date;
          ends_at: Date;
          member_id: string;
          service_id: string;
        }>(
          `SELECT b.starts_at,b.ends_at,b.member_id,p.service_id FROM scheduling_booking b JOIN scheduling_procedure p ON p.id=b.procedure_id
         WHERE b.status IN ('scheduled','pending_approval') AND ($3::uuid IS NULL OR b.id<>$3)
         AND (b.member_id=$2 OR (p.service_id=$1 AND b.mode='capacity')) AND b.starts_at<$5 AND b.ends_at>$4`,
          [
            offer.service_id,
            query.beneficiaryId ?? null,
            query.excludeBookingId ?? null,
            hours.start,
            hours.end,
          ],
        )
      ).rows;
      const blocks = (
        await client.query<{ starts_at: Date; ends_at: Date }>(
          "SELECT starts_at,ends_at FROM scheduling_resource_block WHERE service_id=$1 AND professional_id IS NULL AND starts_at<$3 AND ends_at>$2",
          [offer.service_id, hours.start, hours.end],
        )
      ).rows;
      const ranges = [...blocks, ...busy.filter((b) => b.member_id === query.beneficiaryId)].map(
        (b) => ({ start: b.starts_at.getTime(), end: b.ends_at.getTime() }),
      );
      for (const slot of buildSlots(
        {
          start: hours.start.getTime(),
          end: hours.end.getTime(),
          lunchStart: null,
          lunchEnd: null,
        },
        offer.duration_minutes,
        ranges,
        now,
      )) {
        const start = Date.parse(slot.startsAt),
          end = Date.parse(slot.endsAt);
        const intersecting = busy.filter(
          (b) =>
            b.service_id === offer.service_id &&
            b.starts_at.getTime() < end &&
            b.ends_at.getTime() > start,
        );
        const points = [
          start,
          ...intersecting.map((b) => b.starts_at.getTime()).filter((t) => t >= start),
        ];
        if (
          points.some(
            (t) =>
              intersecting.filter((b) => b.starts_at.getTime() <= t && b.ends_at.getTime() > t)
                .length >= offer.policy.capacity,
          )
        )
          continue;
        items.push({ ...slot, assignmentId: null, professionalName: null });
      }
    }
  }
  return {
    offer,
    items: items
      .filter((slot) => {
        try {
          validateSchedulingTime(
            offer.policy,
            Date.parse(slot.startsAt),
            now,
            operation,
            originalStart,
          );
          return true;
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    timezone: schedulingTimezone,
    durationMinutes: offer.duration_minutes,
  };
}
