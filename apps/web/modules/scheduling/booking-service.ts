import "server-only";
import type { Pool, PoolClient } from "pg";
import {
  idSchema,
  schedulingBookingSchema,
  schedulingBookingsQuerySchema,
  schedulingCalendarQuerySchema,
  schedulingKeepDeletedMemberSchema,
  schedulingPageQuerySchema,
  type SchedulingBooking,
  type SchedulingEvent,
  type SchedulingPage,
} from "@caab/contracts";
import { schedulingBlockedMembersCte } from "@caab/db/repositories/members";
import type { RequestActor } from "../shared/request-context";
import {
  schedulingAccess,
  schedulingReplay,
  SchedulingError,
  type SchedulingContext,
} from "./access";
import { createWorkflowBooking, commandWorkflowBooking } from "./booking-workflow";
import { auditScheduling } from "./catalog-service";

export const bookingFrom = `FROM scheduling_booking b JOIN member m ON m.id=b.member_id
  JOIN scheduling_procedure p ON p.id=b.procedure_id JOIN scheduling_service s ON s.id=p.service_id
  JOIN scheduling_unit u ON u.id=p.unit_id LEFT JOIN scheduling_professional f ON f.id=b.professional_id`;
export const bookingSelect = `${schedulingBlockedMembersCte} SELECT jsonb_build_object('id',b.id,'memberId',b.member_id,'memberName',m.name,'assignmentId',b.assignment_id,
  'eligibilityWarning',CASE WHEN b.status IN ('scheduled','pending_approval','awaiting_new_time') AND (b.starts_at IS NULL OR b.starts_at>clock_timestamp())
    AND EXISTS(SELECT 1 FROM scheduling_blocked_members blocked WHERE blocked.id=b.member_id) THEN 'blocked' END,
  'unitId',u.id,'unitName',u.name,'serviceId',s.id,'serviceName',s.name,'procedureId',p.id,'procedureName',p.name,
  'professionalId',f.id,'professionalName',f.name,'startsAt',b.starts_at,'endsAt',b.ends_at,
  'memberDeletionEffectiveAt',m.deletion_effective_at,'memberDeleted',coalesce(m.deletion_effective_at<=clock_timestamp(),false),
  'keptAfterMemberDeletion',coalesce(m.deletion_effective_at<=clock_timestamp() AND b.member_deletion_reviewed_at=m.deletion_effective_at,false),
  'memberDeletionKeptAt',CASE WHEN b.member_deletion_reviewed_at=m.deletion_effective_at THEN b.member_deletion_kept_at END,
  'memberDeletionKeptBy',CASE WHEN b.member_deletion_reviewed_at=m.deletion_effective_at THEN (SELECT name FROM "user" WHERE id=b.member_deletion_kept_by) END,
  'mode',b.mode,'confirmedReschedules',b.confirmed_reschedules,'reservedReschedule',b.reserved_reschedule,
  'processKind',b.process_kind,'originalStart',b.original_start,'enteredReviewAt',b.entered_review_at,'immediateConfirmation',b.immediate_confirmation,
  'durationMinutes',b.duration_snapshot,'status',b.status,'version',b.version) AS data ${bookingFrom}`;
export async function readBooking(client: PoolClient, id: string): Promise<SchedulingBooking> {
  const row = (
    await client.query<{ data: SchedulingBooking }>(`${bookingSelect} WHERE b.id=$1`, [id])
  ).rows[0];
  if (!row) throw new SchedulingError("SCHEDULING_NOT_FOUND", 404);
  return schedulingBookingSchema.parse(row.data);
}
export async function listSchedulingBookings(
  pool: Pool,
  actor: RequestActor,
  raw: unknown,
): Promise<SchedulingPage<SchedulingBooking>> {
  const query = schedulingBookingsQuerySchema.parse(raw);
  return schedulingAccess(pool, actor, false, async (client) => {
    const values: unknown[] = [query.date, `%${query.q.replace(/[\\%_]/g, "\\$&")}%`];
    const filters = [
      "b.starts_at >= ($1::date::timestamp AT TIME ZONE 'America/Bahia')",
      "b.starts_at < (($1::date+1)::timestamp AT TIME ZONE 'America/Bahia')",
      "m.name ILIKE $2",
    ];
    for (const [key, col] of [
      ["unitId", "u.id"],
      ["professionalId", "f.id"],
      ["memberId", "m.id"],
      ["status", "b.status"],
    ] as const) {
      if (query[key]) {
        values.push(query[key]);
        filters.push(`${col}=$${values.length}`);
      }
    }
    const where = `WHERE ${filters.join(" AND ")}`;
    const total = Number(
      (await client.query(`SELECT count(*) AS total ${bookingFrom} ${where}`, values)).rows[0]
        .total,
    );
    const items = (
      await client.query<{ data: SchedulingBooking }>(
        `${bookingSelect} ${where} ORDER BY b.starts_at,b.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, query.pageSize, (query.page - 1) * query.pageSize],
      )
    ).rows.map((row) => schedulingBookingSchema.parse(row.data));
    return { items, total, page: query.page, pageSize: query.pageSize };
  });
}
export async function listSchedulingCalendar(pool: Pool, actor: RequestActor, raw: unknown) {
  const query = schedulingCalendarQuerySchema.parse(raw);
  return schedulingAccess(pool, actor, false, async (client) => {
    const values: unknown[] = [query.start, query.end, `%${query.q.replace(/[\\%_]/g, "\\$&")}%`];
    const filters = [
      "b.ends_at > ($1::date::timestamp AT TIME ZONE 'America/Bahia')",
      "b.starts_at < ($2::date::timestamp AT TIME ZONE 'America/Bahia')",
      "m.name ILIKE $3",
    ];
    for (const [key, column] of [
      ["unitId", "u.id"],
      ["professionalId", "f.id"],
      ["status", "b.status"],
    ] as const) {
      if (query[key]) {
        values.push(query[key]);
        filters.push(`${column}=$${values.length}`);
      }
    }
    const rows = (
      await client.query<{ data: SchedulingBooking }>(
        `${bookingSelect} WHERE ${filters.join(" AND ")} ORDER BY b.starts_at,b.id LIMIT 1001`,
        values,
      )
    ).rows;
    if (rows.length > 1000) throw new SchedulingError("SCHEDULING_CALENDAR_LIMIT", 422);
    return { items: rows.map((row) => schedulingBookingSchema.parse(row.data)) };
  });
}
export async function getSchedulingBooking(
  pool: Pool,
  actor: RequestActor,
  id: string,
  raw: unknown = {},
) {
  idSchema.parse(id);
  const query = schedulingPageQuerySchema.parse(raw);
  return schedulingAccess(pool, actor, false, async (client) => {
    const booking = await readBooking(client, id);
    const total = Number(
      (
        await client.query(
          "SELECT count(*) AS total FROM scheduling_booking_event WHERE booking_id=$1",
          [id],
        )
      ).rows[0].total,
    );
    const items = (
      await client.query<SchedulingEvent>(
        `SELECT e.id,e.action,CASE WHEN e.actor_type='system' THEN 'Sistema' ELSE u.name END AS "actorName",e.occurred_at::text AS "occurredAt",e.before,e.after,
      coalesce((SELECT jsonb_agg(jsonb_build_object('kind',n.kind,'status',n.state) ORDER BY n.kind)
        FROM scheduling_notification_intent n WHERE n.event_id=e.id),'[]'::jsonb) AS notifications
      FROM scheduling_booking_event e LEFT JOIN "user" u ON u.id=e.actor_id WHERE e.booking_id=$1 ORDER BY e.occurred_at DESC,e.id DESC LIMIT $2 OFFSET $3`,
        [id, query.pageSize, (query.page - 1) * query.pageSize],
      )
    ).rows;
    return { booking, history: { items, total, page: query.page, pageSize: query.pageSize } };
  });
}
function snapshot(booking: SchedulingBooking) {
  return {
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    status: booking.status,
    version: booking.version,
    memberDeletionEffectiveAt: booking.memberDeletionEffectiveAt,
    keptAfterMemberDeletion: booking.keptAfterMemberDeletion,
    unitName: booking.unitName,
    procedureName: booking.procedureName,
    professionalName: booking.professionalName,
    memberId: booking.memberId,
    confirmedReschedules: booking.confirmedReschedules,
    reservedReschedule: booking.reservedReschedule,
    processKind: booking.processKind,
    originalStart: booking.originalStart,
  };
}
export async function bookingEvent(
  client: PoolClient,
  context: SchedulingContext,
  action: SchedulingEvent["action"],
  booking: SchedulingBooking,
  before?: SchedulingBooking,
) {
  const previous = before ? snapshot(before) : undefined;
  const after = snapshot(booking);
  const teamRole = ["approved", "rejected", "provider_unavailable"].includes(action)
    ? (
        await client.query("SELECT 1 FROM scheduling_unit_team WHERE unit_id=$1 AND user_id=$2", [
          booking.unitId,
          context.actor.userId,
        ])
      ).rowCount
      ? "primary"
      : "backup"
    : undefined;
  const event = await client.query<{ id: string }>(
    "INSERT INTO scheduling_booking_event(booking_id,action,actor_id,before,after) VALUES($1,$2,$3,$4,$5) RETURNING id",
    [
      booking.id,
      action,
      context.actor.userId,
      previous ?? null,
      { ...after, ...(teamRole ? { teamRole } : {}) },
    ],
  );
  const kind =
    action === "cancelled"
      ? "cancelled"
      : action === "rejected"
        ? "rejected"
        : action === "provider_unavailable"
          ? "reschedule_required"
          : booking.status === "scheduled" &&
              (["created", "approved", "rescheduled", "resumed"].includes(action) ||
                (action === "pending_edited" && before?.status === "pending_approval"))
            ? "confirmed"
            : null;
  if (kind)
    await client.query(
      "INSERT INTO scheduling_notification_intent(event_id,member_id,kind) VALUES($1,$2,$3)",
      [event.rows[0]!.id, booking.memberId, kind],
    );
  await auditScheduling(
    client,
    context,
    `scheduling.booking.${action}`,
    "scheduling_booking",
    booking.id,
    previous,
    after,
  );
  return event.rows[0]!.id;
}
export async function createSchedulingBooking(
  pool: Pool,
  context: SchedulingContext,
  raw: unknown,
) {
  return createWorkflowBooking(pool, context, raw);
}
export async function rescheduleSchedulingBooking(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  return commandWorkflowBooking(pool, context, id, "reschedule", raw);
}
export async function cancelSchedulingBooking(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  return commandWorkflowBooking(pool, context, id, "cancel", raw);
}

export async function keepSchedulingBooking(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = schedulingKeepDeletedMemberSchema.parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `booking:${id}:keep`, input, async () => {
      const before = await readBooking(client, id);
      if (before.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      if (!before.memberDeleted || before.memberDeletionEffectiveAt !== input.deletionEffectiveAt)
        throw new SchedulingError("SCHEDULING_MEMBER_DELETION_CHANGED");
      if (before.status !== "scheduled" || Date.parse(before.startsAt ?? "") <= Date.now())
        throw new SchedulingError("SCHEDULING_PAST", 422);
      if (before.keptAfterMemberDeletion) return before;
      const changed = await client.query(
        `UPDATE scheduling_booking SET member_deletion_reviewed_at=$2,member_deletion_kept_at=clock_timestamp(),member_deletion_kept_by=$3,version=version+1
      WHERE id=$1 AND starts_at>clock_timestamp()`,
        [id, input.deletionEffectiveAt, context.actor.userId],
      );
      if (!changed.rowCount) throw new SchedulingError("SCHEDULING_PAST", 422);
      const booking = await readBooking(client, id);
      await bookingEvent(client, context, "kept_after_member_deletion", booking, before);
      return booking;
    }),
  );
}
