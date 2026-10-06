import type { SchedulingAbsenceDecisionOutcome } from "@caab/contracts";

const dayMilliseconds = 86_400_000;

export interface SchedulingAbsenceOccurrence {
  recordedAt: number;
  appeal: {
    submittedAt: number;
    decision: {
      outcome: SchedulingAbsenceDecisionOutcome;
      decidedAt: number;
    } | null;
  } | null;
}

function assertInstant(value: number) {
  if (!Number.isSafeInteger(value) || !Number.isFinite(new Date(value).getTime())) {
    throw new Error("SCHEDULING_ABSENCE_TIMELINE_INVALID");
  }
}

export function absenceDeadlines(recordedAt: number) {
  assertInstant(recordedAt);
  // Consecutive 24-hour days from the recorded instant; not calendar months or midnight.
  const appealDeadline = recordedAt + 7 * dayMilliseconds;
  const restrictionEndsAt = recordedAt + 30 * dayMilliseconds;
  assertInstant(restrictionEndsAt);
  return { appealDeadline, restrictionEndsAt };
}

export function evaluateAbsence(occurrence: SchedulingAbsenceOccurrence, now: number) {
  assertInstant(now);
  const { recordedAt, appeal } = occurrence;
  const deadlines = absenceDeadlines(recordedAt);
  if (appeal) {
    assertInstant(appeal.submittedAt);
    if (appeal.submittedAt < recordedAt || appeal.submittedAt >= deadlines.appealDeadline) {
      throw new Error("SCHEDULING_ABSENCE_TIMELINE_INVALID");
    }
    if (appeal.decision) {
      assertInstant(appeal.decision.decidedAt);
      if (
        appeal.decision.decidedAt < appeal.submittedAt ||
        !["accepted", "rejected"].includes(appeal.decision.outcome)
      ) {
        throw new Error("SCHEDULING_ABSENCE_TIMELINE_INVALID");
      }
    }
  }

  const submitted = appeal !== null && appeal.submittedAt <= now;
  const decision =
    submitted && appeal.decision && appeal.decision.decidedAt <= now
      ? appeal.decision.outcome
      : null;
  // Both windows are half-open: exact day 7 closes submission, exact day 30 releases.
  const restrictionActive =
    now >= recordedAt && now < deadlines.restrictionEndsAt && decision !== "accepted";
  const cancellationReason = !restrictionActive
    ? null
    : decision === "rejected"
      ? "rejected"
      : !submitted && now >= deadlines.appealDeadline
        ? "no_appeal"
        : null;

  return {
    ...deadlines,
    restrictionActive,
    canSubmitAppeal: now >= recordedAt && now < deadlines.appealDeadline && !submitted,
    // The caller must additionally select eligible FUTURE bookings within this occurrence's window.
    // This policy never invalidates attendance on a reservation that is still preserved.
    cancelFutureBookings: cancellationReason !== null,
    cancellationReason,
    historyLabel: decision === "accepted" ? ("Falta abonada" as const) : null,
  };
}

export function hasActiveAbsenceRestriction(
  memberId: string,
  occurrences: readonly (SchedulingAbsenceOccurrence & { memberId: string })[],
  now: number,
) {
  return occurrences.some(
    (occurrence) =>
      occurrence.memberId === memberId && evaluateAbsence(occurrence, now).restrictionActive,
  );
}
