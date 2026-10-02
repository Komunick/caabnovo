import "server-only";
import type { Pool, PoolClient } from "pg";
import {
  idSchema,
  schedulingCreateSchema,
  schedulingRescheduleSchema,
  schedulingPendingEditSchema,
  schedulingCancelSchema,
  type SchedulingBooking,
  type SchedulingEvent,
} from "@caab/contracts";
import {
  schedulingAccess,
  schedulingReplay,
  SchedulingError,
  type SchedulingContext,
} from "./access";
import { readBooking, bookingEvent } from "./booking-service";
import {
  getWorkflowAvailability,
  schedulingOffer,
  requireSchedulingBeneficiary,
} from "./workflow-availability";
import { schedulingDate } from "./availability";
import { requireNoActiveSchedulingAbsence } from "./absence-eligibility";
import { validateSchedulingTime, type SchedulingTimeOperation } from "./policy";

async function nowInDatabase(client: PoolClient) {
  return (
    await client.query<{ now: Date }>("SELECT clock_timestamp() AS now")
  ).rows[0]!.now.getTime();
}
async function requireSlot(
  client: PoolClient,
  input: { assignmentId?: string; procedureId?: string; startsAt: string },
  memberId: string,
  operation: SchedulingTimeOperation,
  booking?: SchedulingBooking,
) {
  const offer = await schedulingOffer(client, input.assignmentId, input.procedureId);
  if (booking && offer.service_id !== booking.serviceId)
    throw new SchedulingError("SCHEDULING_PARENT_IMMUTABLE");
  await requireSchedulingBeneficiary(client, memberId, offer.policy.audience);
  const now = await nowInDatabase(client);
  const original = booking?.originalStart ?? booking?.startsAt;
  try {
    validateSchedulingTime(
      offer.policy,
      Date.parse(input.startsAt),
      now,
      operation,
      original ? Date.parse(original) : undefined,
    );
  } catch (error) {
    throw new SchedulingError((error as Error).message, 422);
  }
  const result = await getWorkflowAvailability(
    client,
    {
      assignmentId: input.assignmentId,
      procedureId: offer.id,
      date: schedulingDate(input.startsAt),
      beneficiaryId: memberId,
      excludeBookingId: booking?.id,
    },
    operation,
    original ? Date.parse(original) : undefined,
  );
  const conflict = await client.query(
    `SELECT 1 FROM scheduling_booking WHERE member_id=$1 AND status IN ('scheduled','pending_approval')
    AND ($4::uuid IS NULL OR id<>$4) AND tstzrange(starts_at,ends_at,'[)') &&
    tstzrange($2::timestamptz,$2::timestamptz+$3::int*interval '1 minute','[)') LIMIT 1`,
    [memberId, input.startsAt, offer.duration_minutes, booking?.id ?? null],
  );
  if (conflict.rowCount) throw new SchedulingError("SCHEDULING_BENEFICIARY_CONFLICT");
  const slot = result.items.find((s) => Date.parse(s.startsAt) === Date.parse(input.startsAt));
  if (!slot || (input.assignmentId && input.assignmentId !== slot.assignmentId))
    throw new SchedulingError("SCHEDULING_CONFLICT");
  if (offer.policy.mode === "professional" && !input.assignmentId)
    throw new SchedulingError("SCHEDULING_PROFESSIONAL_REVIEW_REQUIRED", 422);
  const professionalId = slot.assignmentId
    ? (
        await client.query("SELECT professional_id FROM scheduling_assignment WHERE id=$1", [
          slot.assignmentId,
        ])
      ).rows[0]?.professional_id
    : null;
  return { offer, slot, professionalId, now };
}

export async function createWorkflowBooking(pool: Pool, context: SchedulingContext, raw: unknown) {
  const input = schedulingCreateSchema.parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, "booking:create", input, async () => {
      await requireNoActiveSchedulingAbsence(client, input.memberId);
      const { offer, slot, professionalId } = await requireSlot(
        client,
        input,
        input.memberId,
        "new",
      );
      const immediate = offer.policy.immediateConfirmation;
      const row = (
        await client.query<{ id: string }>(
          `INSERT INTO scheduling_booking(procedure_id,assignment_id,professional_id,member_id,starts_at,ends_at,duration_snapshot,
      created_by,mode,status,immediate_confirmation,entered_review_at,confirmed_reschedules)
      SELECT $1,$2,$3,$4,$5::timestamptz,$6,$7,$8,$9,$10,$11,CASE WHEN $11 THEN NULL ELSE clock_timestamp() END,0
      WHERE $5::timestamptz>clock_timestamp() RETURNING id`,
          [
            offer.id,
            slot.assignmentId ?? null,
            professionalId,
            input.memberId,
            slot.startsAt,
            slot.endsAt,
            offer.duration_minutes,
            context.actor.userId,
            offer.policy.mode,
            immediate ? "scheduled" : "pending_approval",
            immediate,
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

export type WorkflowAction =
  | "reschedule"
  | "pending"
  | "approve"
  | "reject"
  | "withdraw"
  | "resume"
  | "provider-unavailability"
  | "cancel";
export async function commandWorkflowBooking(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  action: WorkflowAction,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = (
    action === "pending"
      ? schedulingPendingEditSchema
      : action === "reschedule" || action === "resume"
        ? schedulingRescheduleSchema
        : schedulingCancelSchema
  ).parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `booking:${id}:${action}`, input, async () => {
      const before = await readBooking(client, id);
      if (action === "cancel" && before.status === "cancelled") return before;
      if (before.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      const now = await nowInDatabase(client);
      let event: SchedulingEvent["action"];
      if (action === "approve" || action === "reject" || action === "withdraw") {
        if (before.status !== "pending_approval") throw new SchedulingError("SCHEDULING_STATE");
        if (
          action === "withdraw" &&
          (!before.processKind || !before.originalStart || Date.parse(before.originalStart) <= now)
        )
          throw new SchedulingError("SCHEDULING_PAST", 422);
        if (action === "approve") {
          if (!before.startsAt || Date.parse(before.startsAt) <= now)
            throw new SchedulingError("SCHEDULING_PAST", 422);
          const offer = await schedulingOffer(
            client,
            before.assignmentId ?? undefined,
            before.procedureId,
          );
          await requireSchedulingBeneficiary(client, before.memberId, offer.policy.audience);
          // Approve the interval already held, not a slot rebuilt with today's duration/grid.
          // All scheduling writers share the eligibility lock held by schedulingAccess.
          const blocked = await client.query(
            `SELECT 1 FROM scheduling_resource_block
             WHERE (professional_id=$1::uuid OR (professional_id IS NULL AND service_id=$2))
               AND starts_at<$4::timestamptz AND ends_at>$3::timestamptz LIMIT 1`,
            [before.professionalId, before.serviceId, before.startsAt, before.endsAt],
          );
          if (blocked.rowCount) throw new SchedulingError("SCHEDULING_CONFLICT");
          await client.query(
            `UPDATE scheduling_booking SET status='scheduled',version=version+1,
          confirmed_reschedules=confirmed_reschedules+CASE WHEN reserved_reschedule THEN 1 ELSE 0 END,
          reserved_reschedule=false,process_id=NULL,process_kind=NULL,original_start=NULL,entered_review_at=NULL
          WHERE id=$1 AND starts_at>clock_timestamp()`,
            [id],
          );
          event = "approved";
        } else {
          await client.query(
            `UPDATE scheduling_booking SET status=CASE WHEN process_id IS NULL THEN 'rejected' ELSE 'awaiting_new_time' END,
          starts_at=CASE WHEN process_id IS NULL THEN starts_at ELSE NULL END,ends_at=CASE WHEN process_id IS NULL THEN ends_at ELSE NULL END,
          entered_review_at=NULL,version=version+1 WHERE id=$1`,
            [id],
          );
          event = action === "reject" ? "rejected" : "proposal_withdrawn";
        }
      } else if (action === "cancel") {
        if (
          before.status !== "awaiting_new_time" &&
          before.status !== "scheduled" &&
          before.status !== "pending_approval"
        )
          throw new SchedulingError("SCHEDULING_STATE");
        const reference = before.processKind ? before.originalStart : before.startsAt;
        if (before.status !== "awaiting_new_time" && (!reference || Date.parse(reference) <= now))
          throw new SchedulingError("SCHEDULING_PAST", 422);
        await client.query(
          "UPDATE scheduling_booking SET status='cancelled',reserved_reschedule=false,entered_review_at=NULL,version=version+1 WHERE id=$1 AND (status='awaiting_new_time' OR coalesce(original_start,starts_at)>clock_timestamp())",
          [id],
        );
        event = "cancelled";
      } else if (action === "provider-unavailability") {
        if (before.status !== "scheduled" || !before.startsAt || !before.endsAt)
          throw new SchedulingError("SCHEDULING_STATE");
        // The affected resource is blocked before releasing the reservation. Other reservations are untouched.
        await client.query(
          "INSERT INTO scheduling_resource_block(service_id,professional_id,starts_at,ends_at,created_by) VALUES($1,$2,$3,$4,$5)",
          [
            before.serviceId,
            before.professionalId,
            before.startsAt,
            before.endsAt,
            context.actor.userId,
          ],
        );
        await client.query(
          `UPDATE scheduling_booking SET status='awaiting_new_time',process_id=gen_random_uuid(),process_kind='recovery',
        original_start=starts_at,starts_at=NULL,ends_at=NULL,reserved_reschedule=false,entered_review_at=NULL,version=version+1 WHERE id=$1`,
          [id],
        );
        event = "provider_unavailable";
      } else {
        const destination = schedulingPendingEditSchema.parse(raw);
        if (action === "reschedule" && before.status !== "scheduled")
          throw new SchedulingError("SCHEDULING_STATE");
        if (action === "resume" && before.status !== "awaiting_new_time")
          throw new SchedulingError("SCHEDULING_STATE");
        if (action === "pending" && before.status !== "pending_approval")
          throw new SchedulingError("SCHEDULING_STATE");
        if (action === "reschedule") {
          if (before.confirmedReschedules == null)
            throw new SchedulingError("SCHEDULING_COUNTER_UNKNOWN", 422);
          if (before.confirmedReschedules >= 2)
            throw new SchedulingError("SCHEDULING_RESCHEDULE_LIMIT", 422);
        }
        const memberId = destination.memberId ?? before.memberId;
        if (memberId !== before.memberId) {
          if (before.processKind) throw new SchedulingError("SCHEDULING_STATE");
          const relation = await client.query(
            `SELECT 1 FROM member_relationship WHERE holder_id=$1 AND dependent_id=$2 AND ended_at IS NULL
          AND starts_on<=(clock_timestamp() AT TIME ZONE 'America/Bahia')::date`,
            [before.memberId, memberId],
          );
          if (!relation.rowCount) throw new SchedulingError("SCHEDULING_TRANSFER_DENIED", 403);
          await requireNoActiveSchedulingAbsence(client, memberId);
        }
        const operation: SchedulingTimeOperation =
          action === "resume"
            ? "resume"
            : before.processKind === "recovery"
              ? "recovery"
              : action === "reschedule" || before.processKind === "voluntary"
                ? "reschedule"
                : "new";
        const { offer, slot, professionalId } = await requireSlot(
          client,
          destination,
          memberId,
          operation,
          before,
        );
        const initialEdit = action === "pending" && !before.processKind;
        const immediate = initialEdit
          ? before.immediateConfirmation!
          : offer.policy.immediateConfirmation;
        const voluntary = action === "reschedule" || before.processKind === "voluntary";
        const count = before.confirmedReschedules ?? null;
        const confirmed = voluntary && immediate ? (count ?? 0) + 1 : count;
        const processKind = immediate
          ? null
          : action === "reschedule"
            ? "voluntary"
            : (before.processKind ?? null);
        const originalStart = processKind ? (before.originalStart ?? before.startsAt) : null;
        await client.query(
          `UPDATE scheduling_booking SET assignment_id=$2,professional_id=$3,procedure_id=$4,member_id=$5,
        starts_at=$6,ends_at=$7,duration_snapshot=$8,mode=$9,status=$10,immediate_confirmation=$11,
        confirmed_reschedules=$12,reserved_reschedule=$13,process_kind=$14,
        process_id=CASE WHEN $14::text IS NULL THEN NULL ELSE coalesce(process_id,gen_random_uuid()) END,original_start=$15,
        entered_review_at=CASE WHEN $11 THEN NULL ELSE coalesce(entered_review_at,clock_timestamp()) END,version=version+1
        WHERE id=$1 AND $6::timestamptz>clock_timestamp()`,
          [
            id,
            slot.assignmentId ?? null,
            professionalId,
            offer.id,
            memberId,
            slot.startsAt,
            slot.endsAt,
            offer.duration_minutes,
            offer.policy.mode,
            immediate ? "scheduled" : "pending_approval",
            immediate,
            confirmed,
            voluntary && !immediate,
            processKind,
            originalStart,
          ],
        );
        event =
          memberId !== before.memberId
            ? "transferred"
            : action === "pending"
              ? "pending_edited"
              : action === "resume"
                ? "resumed"
                : immediate
                  ? "rescheduled"
                  : "reschedule_requested";
      }
      const booking = await readBooking(client, id);
      if (booking.version === before.version) throw new SchedulingError("SCHEDULING_PAST", 422);
      await bookingEvent(client, context, event, booking, before);
      return booking;
    }),
  );
}
