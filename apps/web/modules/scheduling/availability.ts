import type { SchedulingSlot } from "@caab/contracts";
export const schedulingTimezone = "America/Bahia";
export function schedulingDate(value: Date | string = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: schedulingTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function buildSlots(
  hours: { start: number; end: number; lunchStart: number | null; lunchEnd: number | null },
  durationMinutes: number,
  busy: Array<{ start: number; end: number }>,
  now: number,
): SchedulingSlot[] {
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440)
    return [];
  const ranges =
    hours.lunchStart !== null && hours.lunchEnd !== null
      ? [
          [hours.start, hours.lunchStart],
          [hours.lunchEnd, hours.end],
        ]
      : [[hours.start, hours.end]];
  const duration = durationMinutes * 60000;
  const slots: SchedulingSlot[] = [];
  for (const [start, end] of ranges) {
    for (let at = start!; at + duration <= end!; at += duration) {
      if (at <= now || busy.some((item) => item.start < at + duration && item.end > at)) continue;
      slots.push({
        startsAt: new Date(at).toISOString(),
        endsAt: new Date(at + duration).toISOString(),
      });
    }
  }
  return slots;
}
