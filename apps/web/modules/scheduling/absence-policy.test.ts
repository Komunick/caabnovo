import { describe, expect, it } from "vitest";
import {
  absenceDeadlines,
  evaluateAbsence,
  hasActiveAbsenceRestriction,
  type SchedulingAbsenceOccurrence,
} from "./absence-policy";

const day = 86_400_000;
const recordedAt = Date.parse("2026-01-31T15:30:00Z");
const absence: SchedulingAbsenceOccurrence = { recordedAt, appeal: null };
const pending: SchedulingAbsenceOccurrence = {
  recordedAt,
  appeal: { submittedAt: recordedAt + 6 * day, decision: null },
};

describe("individual absence penalty policy", () => {
  it("counts consecutive days from registration across month boundaries", () => {
    expect(absenceDeadlines(recordedAt)).toEqual({
      appealDeadline: Date.parse("2026-02-07T15:30:00Z"),
      restrictionEndsAt: Date.parse("2026-03-02T15:30:00Z"),
    });
  });

  it("preserves reservations throughout the seven-day response window", () => {
    expect(evaluateAbsence(absence, recordedAt - 1)).toMatchObject({
      restrictionActive: false,
      canSubmitAppeal: false,
      cancelFutureBookings: false,
    });
    for (const now of [recordedAt, recordedAt + 7 * day - 1]) {
      expect(evaluateAbsence(absence, now)).toMatchObject({
        restrictionActive: true,
        canSubmitAppeal: true,
        cancelFutureBookings: false,
      });
    }
    expect(evaluateAbsence(absence, recordedAt + 7 * day)).toMatchObject({
      restrictionActive: true,
      canSubmitAppeal: false,
      cancelFutureBookings: true,
      cancellationReason: "no_appeal",
    });
  });

  it("keeps timely appeals under review while independently expiring the restriction", () => {
    for (const now of [recordedAt + 7 * day, recordedAt + 30 * day - 1]) {
      expect(evaluateAbsence(pending, now)).toMatchObject({
        restrictionActive: true,
        canSubmitAppeal: false,
        cancelFutureBookings: false,
        historyLabel: null,
      });
    }
    expect(evaluateAbsence(pending, recordedAt + 30 * day)).toMatchObject({
      restrictionActive: false,
      cancelFutureBookings: false,
      historyLabel: null,
    });
    expect(evaluateAbsence(absence, recordedAt + 30 * day)).toMatchObject({
      restrictionActive: false,
      cancelFutureBookings: false,
    });
  });

  it("acceptance releases only this occurrence and labels it Falta abonada", () => {
    const accepted = {
      ...pending,
      appeal: {
        ...pending.appeal!,
        decision: { outcome: "accepted" as const, decidedAt: recordedAt + 8 * day },
      },
    };
    expect(evaluateAbsence(accepted, recordedAt + 8 * day - 1)).toMatchObject({
      restrictionActive: true,
      historyLabel: null,
    });
    expect(evaluateAbsence(accepted, recordedAt + 8 * day)).toMatchObject({
      restrictionActive: false,
      cancelFutureBookings: false,
      historyLabel: "Falta abonada",
    });
  });

  it("rejection cancels future reservations only within the original active period", () => {
    const rejected = {
      ...pending,
      appeal: {
        ...pending.appeal!,
        decision: { outcome: "rejected" as const, decidedAt: recordedAt + 8 * day },
      },
    };
    expect(evaluateAbsence(rejected, recordedAt + 8 * day - 1).cancelFutureBookings).toBe(false);
    expect(evaluateAbsence(rejected, recordedAt + 8 * day)).toMatchObject({
      restrictionActive: true,
      cancelFutureBookings: true,
      cancellationReason: "rejected",
      restrictionEndsAt: recordedAt + 30 * day,
    });
    expect(evaluateAbsence(rejected, recordedAt + 30 * day)).toMatchObject({
      restrictionActive: false,
      cancelFutureBookings: false,
    });
  });

  it.each(["accepted", "rejected"] as const)(
    "late %s decisions do not restart or extend the restriction",
    (outcome) => {
      const late = {
        ...pending,
        appeal: { ...pending.appeal!, decision: { outcome, decidedAt: recordedAt + 40 * day } },
      };
      expect(evaluateAbsence(late, recordedAt + 40 * day)).toMatchObject({
        restrictionActive: false,
        cancelFutureBookings: false,
        historyLabel: outcome === "accepted" ? "Falta abonada" : null,
        restrictionEndsAt: recordedAt + 30 * day,
      });
    },
  );

  it("retains independent overlapping occurrences for only the selected beneficiary", () => {
    const occurrences = [
      { ...absence, memberId: "dependent" },
      { recordedAt: recordedAt + 20 * day, appeal: null, memberId: "dependent" },
    ];
    expect(hasActiveAbsenceRestriction("holder", occurrences, recordedAt + 25 * day)).toBe(false);
    expect(hasActiveAbsenceRestriction("dependent", occurrences, recordedAt + 30 * day)).toBe(true);
    expect(hasActiveAbsenceRestriction("dependent", occurrences, recordedAt + 50 * day)).toBe(
      false,
    );
    const accepted = {
      ...pending,
      memberId: "dependent",
      appeal: {
        ...pending.appeal!,
        decision: { outcome: "accepted" as const, decidedAt: recordedAt + 8 * day },
      },
    };
    expect(
      hasActiveAbsenceRestriction("dependent", [accepted, occurrences[1]!], recordedAt + 25 * day),
    ).toBe(true);
  });

  it("rejects invalid or late appeal timelines rather than preserving bookings incorrectly", () => {
    for (const submittedAt of [recordedAt - 1, recordedAt + 7 * day]) {
      expect(() =>
        evaluateAbsence(
          { recordedAt, appeal: { submittedAt, decision: null } },
          recordedAt + 8 * day,
        ),
      ).toThrow("SCHEDULING_ABSENCE_TIMELINE_INVALID");
    }
    expect(() =>
      evaluateAbsence(
        {
          recordedAt,
          appeal: {
            submittedAt: recordedAt + day,
            decision: { outcome: "accepted", decidedAt: recordedAt },
          },
        },
        recordedAt + day,
      ),
    ).toThrow("SCHEDULING_ABSENCE_TIMELINE_INVALID");
    expect(() => absenceDeadlines(Number.NaN)).toThrow("SCHEDULING_ABSENCE_TIMELINE_INVALID");
    expect(() => evaluateAbsence(absence, Number.POSITIVE_INFINITY)).toThrow(
      "SCHEDULING_ABSENCE_TIMELINE_INVALID",
    );
  });
});
