import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { withTransaction } from "../client";
import { writeAuditEvent } from "./audit-writer";
import { lockMemberEligibility } from "./members";

export type SchedulingAbsenceCancellationActor = {
  requestId: string;
  correlationId: string;
} & ({ kind: "user"; userId: string } | { kind: "system" });

type AbsenceDeadlineRow = {
  id: string;
  member_id: string;
  recorded_at: Date;
  appeal_deadline: Date;
  restriction_ends_at: Date;
  finalized_at: Date | null;
  submitted_at: Date | null;
  outcome: "accepted" | "rejected" | null;
};

function auditActor(actor: SchedulingAbsenceCancellationActor) {
  return {
    actorUserId: actor.kind === "user" ? actor.userId : undefined,
    effectiveIdentity:
      actor.kind === "user" ? `user:${actor.userId}` : "worker:scheduling-absence-finalization",
    origin: actor.kind === "user" ? ("web" as const) : ("worker" as const),
    requestId: actor.requestId,
    correlationId: actor.correlationId,
  };
}

/** Caller owns the transaction and must hold lockMemberEligibility, as all scheduling writes do. */
export async function cancelSchedulingAbsenceBookings(
  client: PoolClient,
  absenceId: string,
  actor: SchedulingAbsenceCancellationActor,
  now: Date,
) {
  const absence = (
    await client.query<AbsenceDeadlineRow>(
      `SELECT a.*,p.submitted_at,p.outcome FROM scheduling_absence a
     LEFT JOIN scheduling_absence_appeal p ON p.absence_id=a.id WHERE a.id=$1 FOR UPDATE OF a`,
      [absenceId],
    )
  ).rows[0];
  if (!absence) throw new Error("SCHEDULING_ABSENCE_NOT_FOUND");
  const current = now.getTime();
  if (!Number.isFinite(current)) throw new Error("SCHEDULING_ABSENCE_TIMELINE_INVALID");
  const confirmed = absence.submitted_at
    ? absence.outcome === "rejected"
    : current >= absence.appeal_deadline.getTime();
  if (absence.finalized_at || !confirmed) return { changed: false, cancelledIds: [] as string[] };

  const cancelledIds: string[] = [];
  // Catch-up after day 30 records finalization, but never cancels or extends an expired penalty.
  if (current < absence.restriction_ends_at.getTime()) {
    const affected = await client.query<{ id: string; before: Record<string, unknown> }>(
      `SELECT b.id,jsonb_build_object(
        'startsAt',b.starts_at,'endsAt',b.ends_at,'status',b.status,'version',b.version,
        'memberDeletionEffectiveAt',m.deletion_effective_at,
        'keptAfterMemberDeletion',coalesce(m.deletion_effective_at<=clock_timestamp() AND b.member_deletion_reviewed_at=m.deletion_effective_at,false),
        'unitName',u.name,'procedureName',p.name,'professionalName',f.name,'memberId',b.member_id,
        'confirmedReschedules',b.confirmed_reschedules,'reservedReschedule',b.reserved_reschedule,
        'processKind',b.process_kind,'originalStart',b.original_start) AS before
       FROM scheduling_booking b JOIN member m ON m.id=b.member_id
       JOIN scheduling_procedure p ON p.id=b.procedure_id JOIN scheduling_unit u ON u.id=p.unit_id
       LEFT JOIN scheduling_professional f ON f.id=b.professional_id
       WHERE b.member_id=$1 AND b.status IN ('scheduled','pending_approval')
         AND b.starts_at>$2 AND b.starts_at>=$3 AND b.starts_at<$4
       ORDER BY b.starts_at,b.id FOR UPDATE OF b`,
      [absence.member_id, now, absence.recorded_at, absence.restriction_ends_at],
    );
    for (const booking of affected.rows) {
      const updated = (
        await client.query<{ version: number }>(
          `UPDATE scheduling_booking SET status='cancelled',reserved_reschedule=false,
         entered_review_at=NULL,version=version+1 WHERE id=$1 RETURNING version`,
          [booking.id],
        )
      ).rows[0]!;
      const after = {
        ...booking.before,
        status: "cancelled",
        reservedReschedule: false,
        version: updated.version,
      };
      const event = (
        await client.query<{ id: string }>(
          `INSERT INTO scheduling_booking_event(booking_id,action,actor_id,actor_type,occurred_at,before,after)
         VALUES($1,'cancelled',$2,$3,$4,$5,$6) RETURNING id`,
          [
            booking.id,
            actor.kind === "user" ? actor.userId : null,
            actor.kind,
            now,
            booking.before,
            after,
          ],
        )
      ).rows[0]!;
      await client.query(
        "INSERT INTO scheduling_notification_intent(event_id,member_id,kind) VALUES($1,$2,'cancelled')",
        [event.id, absence.member_id],
      );
      await client.query(
        "INSERT INTO scheduling_absence_cancellation(absence_id,booking_id,event_id) VALUES($1,$2,$3)",
        [absenceId, booking.id, event.id],
      );
      await writeAuditEvent(client, {
        ...auditActor(actor),
        action: "scheduling.booking.cancelled",
        entityType: "scheduling_booking",
        entityId: booking.id,
        before: booking.before,
        after,
      });
      cancelledIds.push(booking.id);
    }
  }
  await client.query("UPDATE scheduling_absence SET finalized_at=$2 WHERE id=$1", [absenceId, now]);
  return { changed: true, cancelledIds };
}

/** Rechecks under the same lock used by submissions/decisions/booking commands; retries are safe. */
export async function processExpiredSchedulingAbsences(pool: Pool, limit = 25) {
  if (!Number.isSafeInteger(limit) || limit < 1)
    throw new Error("SCHEDULING_ABSENCE_BATCH_INVALID");
  const failures: string[] = [];
  const result = await withTransaction(pool, async (client) => {
    const due = await client.query<{ id: string }>(
      `SELECT a.id FROM scheduling_absence a WHERE a.finalized_at IS NULL AND a.appeal_deadline<=clock_timestamp()
       AND NOT EXISTS(SELECT 1 FROM scheduling_absence_appeal p WHERE p.absence_id=a.id)
       ORDER BY a.appeal_deadline,a.id LIMIT $1`,
      [limit],
    );
    let finalized = 0;
    let cancelled = 0;
    if (due.rows.length) await lockMemberEligibility(client);
    for (const absence of due.rows) {
      await client.query("SAVEPOINT absence_finalization");
      try {
        const now = (await client.query<{ now: Date }>("SELECT clock_timestamp() AS now")).rows[0]!
          .now;
        const actor: SchedulingAbsenceCancellationActor = {
          kind: "system",
          requestId: randomUUID(),
          correlationId: absence.id,
        };
        const result = await cancelSchedulingAbsenceBookings(client, absence.id, actor, now);
        if (!result.changed) {
          await client.query("RELEASE SAVEPOINT absence_finalization");
          continue;
        }
        const row = (
          await client.query<{ member_id: string; restriction_ends_at: Date; version: number }>(
            "UPDATE scheduling_absence SET version=version+1 WHERE id=$1 RETURNING member_id,restriction_ends_at,version",
            [absence.id],
          )
        ).rows[0]!;
        const after = {
          id: absence.id,
          memberId: row.member_id,
          version: row.version,
          finalizedAt: now.toISOString(),
          restrictionEndsAt: row.restriction_ends_at.toISOString(),
          restrictionActive: now < row.restriction_ends_at,
          reason: now < row.restriction_ends_at ? "no_appeal" : "restriction_expired",
          cancelledBookingIds: result.cancelledIds,
        };
        await client.query(
          `INSERT INTO scheduling_absence_event(absence_id,action,actor_id,actor_type,occurred_at,after)
         VALUES($1,'finalized',NULL,'system',$2,$3)`,
          [absence.id, now, after],
        );
        await writeAuditEvent(client, {
          ...auditActor(actor),
          action: "scheduling.absence.finalized",
          entityType: "scheduling_absence",
          entityId: absence.id,
          after,
        });
        finalized++;
        cancelled += result.cancelledIds.length;
        await client.query("RELEASE SAVEPOINT absence_finalization");
      } catch {
        await client.query("ROLLBACK TO SAVEPOINT absence_finalization");
        await client.query("RELEASE SAVEPOINT absence_finalization");
        failures.push(absence.id);
      }
    }
    return { finalized, cancelled };
  });
  // Commit successful occurrences before notifying the queue to retry failed ones.
  if (failures.length)
    throw new Error("SCHEDULING_ABSENCE_FINALIZATION_FAILED: " + failures.join(","));
  return result;
}
