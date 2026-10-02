import { describe, expect, it } from "vitest";
import { schedulingPolicySchema } from "@caab/contracts";
import { validateSchedulingTime, schedulingQueueSignals } from "./policy";

const now = Date.parse("2026-10-01T12:00:00Z");
const policy = schedulingPolicySchema.parse({});
describe("shared rules for administrative scheduling", () => {
  it("requires a future destination and allows exact horizon/minimum boundaries", () => {
    expect(() => validateSchedulingTime(policy, now, now, "new")).toThrow("SCHEDULING_PAST");
    expect(() => validateSchedulingTime(policy, now + 90 * 86400000, now, "new")).not.toThrow();
    expect(() => validateSchedulingTime(policy, now + 90 * 86400000 + 1, now, "new")).toThrow(
      "SCHEDULING_HORIZON",
    );
    const limited = { ...policy, minimumNoticeHours: 2 };
    expect(() => validateSchedulingTime(limited, now + 7200000, now, "new")).not.toThrow();
    expect(() => validateSchedulingTime(limited, now + 7199999, now, "new")).toThrow(
      "SCHEDULING_NOTICE",
    );
  });
  it("uses the original start for voluntary changes but not recovery or resumption", () => {
    expect(() =>
      validateSchedulingTime(policy, now + 100000, now, "reschedule", now + 86400000),
    ).not.toThrow();
    expect(() =>
      validateSchedulingTime(policy, now + 86400000, now, "reschedule", now + 86399999),
    ).toThrow("SCHEDULING_RESCHEDULE_NOTICE");
    expect(() =>
      validateSchedulingTime(policy, now + 100000, now, "resume", now - 1000),
    ).not.toThrow();
    expect(() =>
      validateSchedulingTime(policy, now + 100000, now, "recovery", now - 1000),
    ).not.toThrow();
  });
  it("approval does not reapply a reduced horizon or initial notice", () => {
    expect(() =>
      validateSchedulingTime(
        { ...policy, horizonDays: 1, minimumNoticeHours: 24 },
        now + 200000000,
        now,
        "approve",
      ),
    ).not.toThrow();
    expect(() => validateSchedulingTime(policy, now, now, "approve")).toThrow("SCHEDULING_PAST");
  });
  it("keeps review age and destination urgency independent, including elapsed destinations", () => {
    expect(schedulingQueueSignals(policy, now - 86400000, now + 86400000, now)).toMatchObject({
      overdue: true,
      urgent: true,
    });
    expect(
      schedulingQueueSignals({ ...policy, reviewAlertHours: null }, now - 999999999, now - 1, now),
    ).toMatchObject({ overdue: false, urgent: true });
    expect(schedulingQueueSignals(policy, now - 86399999, now + 86400001, now)).toMatchObject({
      overdue: false,
      urgent: false,
    });
  });
});
