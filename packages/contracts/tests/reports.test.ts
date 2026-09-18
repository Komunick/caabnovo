import { describe, expect, it } from "vitest";
import {
  reportBounds,
  reportChange,
  reportPreset,
  reportQuerySchema,
  analyticsEventSchema,
} from "../src/reports";
describe("report contracts", () => {
  it("rejects impossible dates, reversed/oversized periods and injected fields", () => {
    for (const input of [
      { from: "2026-02-30", to: "2026-03-01" },
      { from: "2026-03-01", to: "2026-02-01" },
      { from: "2024-01-01", to: "2026-01-01" },
      { from: "2026-01-01", to: "2026-01-02", columns: ["cpf"] },
      { from: "2026-01-01", to: "2026-01-02", sort: "date; DROP TABLE member" },
    ])
      expect(reportQuerySchema.safeParse(input).success).toBe(false);
  });
  it("uses Bahia days and inclusive end date, equal previous duration", () => {
    const range = reportBounds({ from: "2026-09-01", to: "2026-09-07" });
    expect(range.from.toISOString()).toBe("2026-09-01T03:00:00.000Z");
    expect(range.until.toISOString()).toBe("2026-09-08T03:00:00.000Z");
    expect(range.previousFrom.toISOString()).toBe("2026-08-25T03:00:00.000Z");
    expect(reportPreset("week", new Date("2026-09-18T12:00:00Z"))).toEqual({
      from: "2026-09-14",
      to: "2026-09-18",
    });
    expect(reportChange(4, 0)).toBeNull();
    expect(reportChange(2, 4)).toBe(-50);
  });
  it("rejects arbitrary personal properties and summing unique visitors by group", () => {
    expect(analyticsEventSchema.safeParse({ email: "not-collected@example.test" }).success).toBe(
      false,
    );
    expect(
      reportQuerySchema.safeParse({
        from: "2026-09-01",
        to: "2026-09-02",
        dataset: "access",
        groupBy: "source",
      }).success,
    ).toBe(false);
  });
});
