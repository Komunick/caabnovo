import "server-only";
import type { Pool, PoolClient } from "pg";
import {
  idSchema,
  schedulingAbsenceRecordSchema,
  schedulingAbsenceAppealSchema,
  schedulingAbsenceDecisionSchema,
  schedulingAbsenceQuerySchema,
  type SchedulingAbsence,
  type SchedulingAbsenceListItem,
  type SchedulingPage,
  type SchedulingAbsenceAppealKind,
  type SchedulingAbsenceDecisionOutcome,
} from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import {
  schedulingAccess,
  schedulingReplay,
  SchedulingError,
  type SchedulingContext,
} from "./access";
import { auditScheduling } from "./catalog-service";
import { readBooking } from "./booking-service";
import { cancelSchedulingAbsenceBookings } from "@caab/db/repositories/scheduling-absence-finalization";
import { evaluateAbsence } from "./absence-policy";

type AbsenceRow = {
  id: string;
  booking_id: string;
  member_id: string;
  recorded_at: Date;
  appeal_deadline: Date;
  restriction_ends_at: Date;
  version: number;
  finalized_at: Date | null;
  kind: SchedulingAbsenceAppealKind | null;
  submitted_at: Date | null;
  outcome: SchedulingAbsenceDecisionOutcome | null;
  decided_at: Date | null;
  recorded_by_name: string;
  submitted_by_name: string | null;
  decided_by_name: string | null;
};
const absenceFrom = `FROM scheduling_absence a
  LEFT JOIN scheduling_absence_appeal p ON p.absence_id=a.id
  JOIN "user" recorder ON recorder.id=a.recorded_by
  LEFT JOIN "user" submitter ON submitter.id=p.submitted_by
  LEFT JOIN "user" decider ON decider.id=p.decided_by`;
const absenceColumns = `a.*,p.kind,p.submitted_at,p.outcome,p.decided_at,
  recorder.name AS recorded_by_name,submitter.name AS submitted_by_name,decider.name AS decided_by_name`;
const absenceSelect = `SELECT ${absenceColumns} ${absenceFrom}`;
/** Internal SQL only: aliases a (occurrence), p (appeal); never pass request input as nowSql. */
export function absenceStatusSql(nowSql = "clock_timestamp()") {
  return `CASE WHEN p.outcome IS NOT NULL THEN p.outcome
  WHEN p.submitted_at IS NOT NULL THEN 'under_review'
  WHEN a.appeal_deadline>${nowSql} THEN 'awaiting_response' ELSE 'unanswered' END`;
}
async function readAbsence(client: PoolClient, id: string) {
  const row = (await client.query<AbsenceRow>(`${absenceSelect} WHERE a.id=$1`, [id])).rows[0];
  if (!row) throw new SchedulingError("SCHEDULING_ABSENCE_NOT_FOUND", 404);
  return row;
}
function state(row: AbsenceRow, now: number) {
  return evaluateAbsence(
    {
      recordedAt: row.recorded_at.getTime(),
      appeal: row.submitted_at
        ? {
            submittedAt: row.submitted_at.getTime(),
            decision:
              row.outcome && row.decided_at
                ? { outcome: row.outcome, decidedAt: row.decided_at.getTime() }
                : null,
          }
        : null,
    },
    now,
  );
}
function projection(row: AbsenceRow, now: number): SchedulingAbsence {
  const current = state(row, now);
  return {
    id: row.id,
    bookingId: row.booking_id,
    memberId: row.member_id,
    recordedAt: row.recorded_at.toISOString(),
    recordedByName: row.recorded_by_name,
    appealDeadline: row.appeal_deadline.toISOString(),
    restrictionEndsAt: row.restriction_ends_at.toISOString(),
    version: row.version,
    finalizedAt: row.finalized_at?.toISOString() ?? null,
    status:
      row.outcome ??
      (row.submitted_at
        ? "under_review"
        : current.canSubmitAppeal
          ? "awaiting_response"
          : "unanswered"),
    appeal:
      row.kind && row.submitted_at
        ? {
            kind: row.kind,
            submittedAt: row.submitted_at.toISOString(),
            submittedByName: row.submitted_by_name!,
            outcome: row.outcome,
            decidedAt: row.decided_at?.toISOString() ?? null,
            decidedByName: row.decided_by_name,
          }
        : null,
    restrictionActive: current.restrictionActive,
    canSubmitAppeal: current.canSubmitAppeal,
    historyLabel: current.historyLabel,
  };
}
async function nowInDatabase(client: PoolClient) {
  return (await client.query<{ now: Date }>("SELECT clock_timestamp() AS now")).rows[0]!.now;
}
async function absenceEvent(
  client: PoolClient,
  context: SchedulingContext,
  row: AbsenceRow,
  action: "recorded" | "appeal_submitted" | "accepted" | "rejected" | "finalized",
  now: Date,
) {
  // No free text, filenames, storage keys or evidence content enters audit/outbox payloads.
  const after = projection(row, now.getTime());
  const event = (
    await client.query<{ id: string }>(
      "INSERT INTO scheduling_absence_event(absence_id,action,actor_id,occurred_at,after) VALUES($1,$2,$3,$4,$5) RETURNING id",
      [row.id, action, context.actor.userId, now, after],
    )
  ).rows[0]!;
  const kind =
    action === "recorded"
      ? "absence_notice"
      : action === "appeal_submitted"
        ? "appeal_received"
        : action === "finalized"
          ? null
          : "appeal_decided";
  if (kind)
    await client.query(
      "INSERT INTO scheduling_absence_notification_intent(event_id,member_id,kind) VALUES($1,$2,$3)",
      [event.id, row.member_id, kind],
    );
  await auditScheduling(
    client,
    context,
    `scheduling.absence.${action}`,
    "scheduling_absence",
    row.id,
    undefined,
    { ...after },
  );
}

export async function getSchedulingAbsence(pool: Pool, actor: RequestActor, id: string) {
  idSchema.parse(id);
  return schedulingAccess(pool, actor, false, async (client) =>
    projection(await readAbsence(client, id), (await nowInDatabase(client)).getTime()),
  );
}

export async function recordSchedulingAbsence(
  pool: Pool,
  context: SchedulingContext,
  bookingId: string,
  raw: unknown,
) {
  idSchema.parse(bookingId);
  const input = schedulingAbsenceRecordSchema.parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `absence:record:${bookingId}`, input, async () => {
      const booking = await readBooking(client, bookingId);
      if (booking.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      const existing = await client.query("SELECT id FROM scheduling_absence WHERE booking_id=$1", [
        bookingId,
      ]);
      if (existing.rowCount) throw new SchedulingError("SCHEDULING_ABSENCE_ALREADY_RECORDED");
      const now = await nowInDatabase(client);
      if (
        booking.status !== "scheduled" ||
        !booking.endsAt ||
        Date.parse(booking.endsAt) > now.getTime()
      )
        throw new SchedulingError("SCHEDULING_ABSENCE_BOOKING_STATE", 422);
      const inserted = (
        await client.query<{ id: string }>(
          `INSERT INTO scheduling_absence(booking_id,member_id,recorded_by,recorded_at,appeal_deadline,restriction_ends_at)
      VALUES($1,$2,$3,$4,$4::timestamptz+interval '168 hours',$4::timestamptz+interval '720 hours') RETURNING id`,
          [bookingId, booking.memberId, context.actor.userId, now],
        )
      ).rows[0]!;
      const row = await readAbsence(client, inserted.id);
      await absenceEvent(client, context, row, "recorded", now);
      return projection(row, now.getTime());
    }),
  );
}

export async function submitSchedulingAbsenceAppeal(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const parsed = schedulingAbsenceAppealSchema.parse(raw);
  const input = { ...parsed, evidenceFileIds: [...new Set(parsed.evidenceFileIds)] };
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `absence:appeal:${id}`, input, async () => {
      const before = await readAbsence(client, id);
      if (before.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      const now = await nowInDatabase(client);
      if (!state(before, now.getTime()).canSubmitAppeal)
        throw new SchedulingError("SCHEDULING_ABSENCE_APPEAL_CLOSED", 422);
      const files = await client.query(
        `SELECT id FROM stored_file WHERE id=ANY($1::uuid[]) AND owner_type='member'
      AND owner_id=$2 AND uploaded_by=$3 AND visibility='private' AND status='available' AND scan_result='clean'
      AND deleted_at IS NULL FOR SHARE`,
        [input.evidenceFileIds, before.member_id, context.actor.userId],
      );
      if (files.rowCount !== input.evidenceFileIds.length)
        throw new SchedulingError("SCHEDULING_ABSENCE_EVIDENCE_INVALID", 422);
      await client.query(
        `INSERT INTO scheduling_absence_appeal(absence_id,kind,explanation,submitted_by,submitted_at) VALUES($1,$2,$3,$4,$5)`,
        [id, input.kind, input.explanation, context.actor.userId, now],
      );
      await client.query(
        "INSERT INTO scheduling_absence_evidence(absence_id,file_id) SELECT $1,unnest($2::uuid[])",
        [id, input.evidenceFileIds],
      );
      await client.query("UPDATE scheduling_absence SET version=version+1 WHERE id=$1", [id]);
      const row = await readAbsence(client, id);
      await absenceEvent(client, context, row, "appeal_submitted", now);
      return projection(row, now.getTime());
    }),
  );
}

export async function decideSchedulingAbsence(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = schedulingAbsenceDecisionSchema.parse(raw);
  return schedulingAccess(pool, context.actor, "review_absences", (client) =>
    schedulingReplay(client, context, `absence:decision:${id}`, input, async () => {
      const before = await readAbsence(client, id);
      if (before.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      if (!before.submitted_at || before.outcome)
        throw new SchedulingError("SCHEDULING_ABSENCE_DECISION_STATE", 422);
      const now = await nowInDatabase(client);
      await client.query(
        "UPDATE scheduling_absence_appeal SET outcome=$2,decided_by=$3,decided_at=$4 WHERE absence_id=$1",
        [id, input.outcome, context.actor.userId, now],
      );
      await client.query("UPDATE scheduling_absence SET version=version+1 WHERE id=$1", [id]);
      let row = await readAbsence(client, id);
      if (input.outcome === "rejected") {
        await cancelAbsenceBookings(client, context, row, now);
        row = await readAbsence(client, id);
      }
      await absenceEvent(client, context, row, input.outcome, now);
      return projection(row, now.getTime());
    }),
  );
}

async function cancelAbsenceBookings(
  client: PoolClient,
  context: SchedulingContext,
  row: AbsenceRow,
  now: Date,
) {
  return cancelSchedulingAbsenceBookings(
    client,
    row.id,
    {
      kind: "user",
      userId: context.actor.userId,
      requestId: context.requestId,
      correlationId: context.correlationId,
    },
    now,
  );
}

/** Internal administrative command. Automatic deadlines use the worker repository without a user session. */
export async function finalizeSchedulingAbsence(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = schedulingAbsenceRecordSchema.parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `absence:finalize:${id}`, input, async () => {
      const before = await readAbsence(client, id);
      if (before.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      const now = await nowInDatabase(client);
      if (before.finalized_at) return projection(before, now.getTime());
      if (!state(before, now.getTime()).cancelFutureBookings)
        throw new SchedulingError("SCHEDULING_ABSENCE_FINALIZATION_STATE", 422);
      await cancelAbsenceBookings(client, context, before, now);
      await client.query("UPDATE scheduling_absence SET version=version+1 WHERE id=$1", [id]);
      const row = await readAbsence(client, id);
      await absenceEvent(client, context, row, "finalized", now);
      return projection(row, now.getTime());
    }),
  );
}

/** The general list never reads the explanation, file IDs or file metadata. */
export async function listSchedulingAbsences(
  pool: Pool,
  actor: RequestActor,
  raw: unknown = {},
): Promise<SchedulingPage<SchedulingAbsenceListItem>> {
  const query = schedulingAbsenceQuerySchema.parse(raw);
  return schedulingAccess(pool, actor, false, async (client) => {
    const now = await nowInDatabase(client);
    const values: unknown[] = [now];
    const filters: string[] = [];
    if (query.status !== "all") {
      values.push(query.status);
      filters.push(`(${absenceStatusSql("$1::timestamptz")})=$${values.length}`);
    }
    if (query.q) {
      values.push(`%${query.q.replace(/[\\%_]/g, "\\$&")}%`);
      filters.push(`m.name ILIKE $${values.length}`);
    }
    for (const [key, column] of [
      ["bookingId", "a.booking_id"],
      ["memberId", "a.member_id"],
    ] as const) {
      if (query[key]) {
        values.push(query[key]);
        filters.push(`${column}=$${values.length}`);
      }
    }
    const joins = `${absenceFrom}
      JOIN scheduling_booking b ON b.id=a.booking_id
      JOIN member m ON m.id=a.member_id
      JOIN scheduling_procedure procedure ON procedure.id=b.procedure_id
      JOIN scheduling_unit unit ON unit.id=procedure.unit_id`;
    // Always bind the captured clock, including the all-status case.
    const where = `WHERE $1::timestamptz IS NOT NULL${filters.length ? ` AND ${filters.join(" AND ")}` : ""}`;
    const total = Number(
      (await client.query<{ total: string }>(`SELECT count(*) AS total ${joins} ${where}`, values))
        .rows[0]!.total,
    );
    values.push(query.pageSize, (query.page - 1) * query.pageSize);
    const rows = (
      await client.query<
        AbsenceRow & {
          member_name: string;
          unit_name: string;
          procedure_name: string;
          starts_at: Date | null;
          ends_at: Date | null;
        }
      >(
        `SELECT ${absenceColumns},m.name AS member_name,unit.name AS unit_name,
        procedure.name AS procedure_name,b.starts_at,b.ends_at
       ${joins} ${where} ORDER BY a.recorded_at DESC,a.id DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values,
      )
    ).rows;
    return {
      items: rows.map((row) => ({
        ...projection(row, now.getTime()),
        memberName: row.member_name,
        unitName: row.unit_name,
        procedureName: row.procedure_name,
        startsAt: row.starts_at?.toISOString() ?? null,
        endsAt: row.ends_at?.toISOString() ?? null,
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  });
}
