import { describe, expect, it } from "vitest";
import { schedulingPolicySchema, schedulingPolicySaveSchema } from "./scheduling-policy";

describe("administrative scheduling policies", () => {
  it("keeps independent defaults for acceptance, eligibility, deadlines and alerts", () => {
    expect(schedulingPolicySchema.parse({})).toEqual({
      immediateConfirmation: true,
      audience: "all",
      mode: "professional",
      capacity: 1,
      allowProfessionalChoice: true,
      minimumNoticeHours: 0,
      horizonDays: 90,
      rescheduleNoticeHours: 24,
      reviewAlertHours: 24,
      urgencyHours: 24,
    });
  });
  it("allows disabling only the specified limits", () => {
    expect(
      schedulingPolicySchema.parse({
        horizonDays: null,
        rescheduleNoticeHours: 0,
        reviewAlertHours: null,
        minimumNoticeHours: 0,
      }).horizonDays,
    ).toBeNull();
    expect(schedulingPolicySchema.safeParse({ urgencyHours: null }).success).toBe(false);
  });
  it.each([
    { capacity: 0 },
    { capacity: 1.5 },
    { mode: "unlimited" },
    { audience: "dependent_only" },
    { minimumNoticeHours: -1 },
    { confirmedReschedules: 0 },
    { override: true },
    { actorId: "forged" },
  ])("rejects invalid or privileged policy input %j", (input) => {
    expect(schedulingPolicySchema.safeParse(input).success).toBe(false);
  });
  it("requires a current version and explicit publication intent", () => {
    expect(schedulingPolicySaveSchema.safeParse({ policy: {}, publish: true }).success).toBe(false);
    expect(
      schedulingPolicySaveSchema.parse({ expectedVersion: 1, policy: {}, publish: false }).publish,
    ).toBe(false);
  });
});
