import { describe, expect, it } from "vitest";
import { calendarRange, moveCalendarDate, calendarView } from "./calendar";

describe("calendar navigation", () => {
  it("covers the six displayed month weeks and the year boundary", () => {
    expect(calendarRange("2026-01-15", "month")).toEqual({
      start: "2025-12-28",
      end: "2026-02-08",
    });
    expect(calendarRange("2026-09-18", "week")).toEqual({ start: "2026-09-13", end: "2026-09-20" });
    expect(calendarRange("2026-12-31", "day")).toEqual({ start: "2026-12-31", end: "2027-01-01" });
  });
  it("does not skip February when navigating from the end of January", () => {
    expect(moveCalendarDate("2028-01-31", "month", 1)).toBe("2028-02-01");
    expect(moveCalendarDate("2026-01-01", "week", -1)).toBe("2025-12-25");
    expect(calendarView("unknown")).toBe("list");
  });
});
