import { describe, expect, it } from "vitest";
import {
  schedulingCatalogSchemas,
  schedulingHoursSchema,
  schedulingCreateSchema,
  schedulingBookingsQuerySchema,
} from "./scheduling";
describe("scheduling contracts", () => {
  it("rejects invalid duration and client-controlled booking fields", () => {
    expect(
      schedulingCatalogSchemas.procedures.safeParse({
        name: "Consulta",
        serviceId: crypto.randomUUID(),
        durationMinutes: 0,
      }).success,
    ).toBe(false);
    expect(
      schedulingCreateSchema.safeParse({
        memberId: crypto.randomUUID(),
        assignmentId: crypto.randomUUID(),
        startsAt: "2026-09-21T10:00:00-03:00",
        status: "scheduled",
      }).success,
    ).toBe(false);
  });
  it.each(
    [
      [{ weekday: 1, start: "18:00", end: "08:00" }],
      [{ weekday: 1, start: "08:00", end: "18:00", lunchStart: "12:00" }],
      [{ weekday: 1, start: "08:00", end: "18:00", lunchStart: "07:00", lunchEnd: "09:00" }],
      [
        { weekday: 1, start: "08:00", end: "18:00" },
        { weekday: 1, start: "09:00", end: "17:00" },
      ],
    ].map((rows) => ({ rows })),
  )("rejects invalid weekly hours $rows", ({ rows }) => {
    expect(schedulingHoursSchema.safeParse({ expectedVersion: 1, rows }).success).toBe(false);
  });
  it("accepts closed weeks, validates dates and bounds pagination", () => {
    expect(schedulingHoursSchema.parse({ expectedVersion: 1, rows: [] }).rows).toEqual([]);
    expect(schedulingBookingsQuerySchema.safeParse({ date: "2026-02-30" }).success).toBe(false);
    expect(
      schedulingBookingsQuerySchema.safeParse({ date: "2026-09-21", pageSize: 101 }).success,
    ).toBe(false);
  });
});
