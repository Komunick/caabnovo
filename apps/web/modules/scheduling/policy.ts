import type { SchedulingPolicy } from "@caab/contracts";

export type SchedulingTimeOperation = "new" | "reschedule" | "resume" | "recovery" | "approve";
// Pure rules are shared by availability, commands and the administrative UI tests.
export function validateSchedulingTime(
  policy: SchedulingPolicy,
  start: number,
  now: number,
  operation: SchedulingTimeOperation,
  originalStart?: number,
) {
  if (!Number.isFinite(start) || start <= now) throw new Error("SCHEDULING_PAST");
  if (operation === "approve") return;
  if (policy.horizonDays !== null && start > now + policy.horizonDays * 86400000)
    throw new Error("SCHEDULING_HORIZON");
  if (operation === "new" && start < now + policy.minimumNoticeHours * 3600000)
    throw new Error("SCHEDULING_NOTICE");
  if (
    operation === "reschedule" &&
    (!Number.isFinite(originalStart) ||
      originalStart! <= now ||
      originalStart! < now + policy.rescheduleNoticeHours * 3600000)
  )
    throw new Error("SCHEDULING_RESCHEDULE_NOTICE");
}

export function schedulingQueueSignals(
  policy: SchedulingPolicy,
  enteredReview: number,
  destination: number,
  now: number,
) {
  const ageHours = Math.max(0, (now - enteredReview) / 3600000);
  return {
    ageHours,
    overdue: policy.reviewAlertHours !== null && ageHours >= policy.reviewAlertHours,
    urgent: destination <= now + policy.urgencyHours * 3600000,
  };
}
