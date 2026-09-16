import "server-only";
import type { Pool, PoolClient } from "pg";
import {
  idSchema,
  schedulingBookingSchema,
  schedulingBookingsQuerySchema,
  schedulingCancelSchema,
  schedulingCreateSchema,
  schedulingPageQuerySchema,
  schedulingRescheduleSchema,
  type SchedulingBooking,
  type SchedulingEvent,
  type SchedulingPage,
} from "@caab/contracts";
import { findSchedulingBeneficiary } from "@caab/db/repositories/members";
import type { RequestActor } from "../shared/request-context";
import {
  schedulingAccess,
  schedulingReplay,
  SchedulingError,
  type SchedulingContext,
} from "./access";
import { schedulingDate } from "./availability";
import { readSchedulingSlots } from "./availability-service";
import { auditScheduling } from "./catalog-service";

const bookingFrom = `FROM scheduling_booking b JOIN member m ON m.id=b.member_id JOIN scheduling_assignment a ON a.id=b.assignment_id
  JOIN scheduling_procedure p ON p.id=a.procedure_id JOIN scheduling_service s ON s.id=p.service_id
  JOIN scheduling_unit u ON u.id=a.unit_id JOIN scheduling_professional f ON f.id=b.professional_id`;
const bookingSelect = `SELECT jsonb_build_object('id',b.id,'memberId',b.member_id,'memberName',m.name,'assignmentId',b.assignment_id,
  'unitId',u.id,'unitName',u.name,'serviceId',s.id,'serviceName',s.name,'procedureId',p.id,'procedureName',p.name,
  'professionalId',f.id,'professionalName',f.name,'startsAt',b.starts_at,'endsAt',b.ends_at,
  'durationMinutes',b.duration_snapshot,'status',b.status,'version',b.version) AS data ${bookingFrom}`;
async function readBooking(client: PoolClient, id: string): Promise<SchedulingBooking> {
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
        `SELECT e.id,e.action,u.name AS "actorName",e.occurred_at::text AS "occurredAt",e.before,e.after
      FROM scheduling_booking_event e JOIN "user" u ON u.id=e.actor_id WHERE e.booking_id=$1 ORDER BY e.occurred_at DESC,e.id DESC LIMIT $2 OFFSET $3`,
        [id, query.pageSize, (query.page - 1) * query.pageSize],
      )
    ).rows;
    return { booking, history: { items, total, page: query.page, pageSize: query.pageSize } };
  });
}
async function requireBeneficiary(client: PoolClient, memberId: string) {
  const member = await findSchedulingBeneficiary(client, memberId);
  if (!member) throw new SchedulingError("SCHEDULING_BENEFICIARY_NOT_FOUND", 404);
  if (member.archived || member.blocked)
    throw new SchedulingError("SCHEDULING_BENEFICIARY_BLOCKED", 422);
}
async function requiredSlot(
  client: PoolClient,
  assignmentId: string,
  startsAt: string,
  excludeBookingId?: string,
) {
  const start = new Date(startsAt);
  if (start.getTime() <= Date.now()) throw new SchedulingError("SCHEDULING_PAST", 422);
  const available = await readSchedulingSlots(
    client,
    assignmentId,
    schedulingDate(start),
    excludeBookingId,
  );
  const slot = available.items.find((item) => Date.parse(item.startsAt) === start.getTime());
  if (!slot) throw new SchedulingError("SCHEDULING_CONFLICT");
  return {
    ...slot,
    professionalId: available.professionalId,
    durationMinutes: available.durationMinutes,
  };
}
function snapshot(booking: SchedulingBooking) {
  return {
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    status: booking.status,
    version: booking.version,
    unitName: booking.unitName,
    procedureName: booking.procedureName,
    professionalName: booking.professionalName,
  };
}
async function bookingEvent(
  client: PoolClient,
  context: SchedulingContext,
  action: SchedulingEvent["action"],
  booking: SchedulingBooking,
  before?: SchedulingBooking,
) {
  const previous = before ? snapshot(before) : undefined;
  const after = snapshot(booking);
  await client.query(
    "INSERT INTO scheduling_booking_event(booking_id,action,actor_id,before,after) VALUES($1,$2,$3,$4,$5)",
    [booking.id, action, context.actor.userId, previous ?? null, after],
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
}
export async function createSchedulingBooking(
  pool: Pool,
  context: SchedulingContext,
  raw: unknown,
) {
  const input = schedulingCreateSchema.parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, "booking:create", input, async () => {
      await requireBeneficiary(client, input.memberId);
      const slot = await requiredSlot(client, input.assignmentId, input.startsAt);
      const row = (
        await client.query<{ id: string }>(
          `INSERT INTO scheduling_booking(assignment_id,professional_id,member_id,starts_at,ends_at,duration_snapshot,created_by)
      SELECT $1,$2,$3,$4::timestamptz,$5,$6,$7 WHERE $4::timestamptz>clock_timestamp() RETURNING id`,
          [
            input.assignmentId,
            slot.professionalId,
            input.memberId,
            slot.startsAt,
            slot.endsAt,
            slot.durationMinutes,
            context.actor.userId,
          ],
        )
      ).rows[0];
      if (!row) throw new SchedulingError("SCHEDULING_PAST", 422);
      const booking = await readBooking(client, row.id);
      await bookingEvent(client, context, "created", booking);
      return booking;
    }),
  );
}
export async function rescheduleSchedulingBooking(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = schedulingRescheduleSchema.parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `booking:${id}:reschedule`, input, async () => {
      const before = await readBooking(client, id);
      if (before.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      if (before.status !== "scheduled" || Date.parse(before.startsAt) <= Date.now())
        throw new SchedulingError("SCHEDULING_PAST", 422);
      await requireBeneficiary(client, before.memberId);
      const slot = await requiredSlot(client, input.assignmentId, input.startsAt, id);
      const updated = await client.query(
        `UPDATE scheduling_booking SET assignment_id=$2,professional_id=$3,starts_at=$4,ends_at=$5,duration_snapshot=$6,version=version+1
      WHERE id=$1 AND starts_at>clock_timestamp() AND $4::timestamptz>clock_timestamp()`,
        [
          id,
          input.assignmentId,
          slot.professionalId,
          slot.startsAt,
          slot.endsAt,
          slot.durationMinutes,
        ],
      );
      if (!updated.rowCount) throw new SchedulingError("SCHEDULING_PAST", 422);
      const booking = await readBooking(client, id);
      await bookingEvent(client, context, "rescheduled", booking, before);
      return booking;
    }),
  );
}
export async function cancelSchedulingBooking(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = schedulingCancelSchema.parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `booking:${id}:cancel`, input, async () => {
      const before = await readBooking(client, id);
      if (before.status === "cancelled") return before;
      if (before.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      const updated = await client.query(
        "UPDATE scheduling_booking SET status='cancelled',version=version+1 WHERE id=$1 AND starts_at>clock_timestamp()",
        [id],
      );
      if (!updated.rowCount) throw new SchedulingError("SCHEDULING_PAST", 422);
      const booking = await readBooking(client, id);
      await bookingEvent(client, context, "cancelled", booking, before);
      return booking;
    }),
  );
}
