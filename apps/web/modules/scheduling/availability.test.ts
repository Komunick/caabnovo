import { describe, expect, it } from "vitest";
import { buildSlots } from "./availability";

const instant = (time: string) => Date.parse(`2026-09-21T${time}:00-03:00`);
const hours = {
  start: instant("09:00"),
  end: instant("17:00"),
  lunchStart: instant("12:00"),
  lunchEnd: instant("13:00"),
};
describe("scheduling availability", () => {
  it("honors full duration, lunch, and exact adjacent intervals", () => {
    const slots = buildSlots(
      hours,
      60,
      [{ start: instant("10:00"), end: instant("11:00") }],
      instant("08:00"),
    );
    expect(slots.map((slot) => slot.startsAt)).toEqual(
      ["09:00", "11:00", "13:00", "14:00", "15:00", "16:00"].map((time) =>
        new Date(instant(time)).toISOString(),
      ),
    );
  });
  it("restarts the duration grid after lunch and excludes partial overlaps", () => {
    const slots = buildSlots(
      hours,
      90,
      [{ start: instant("14:00"), end: instant("14:30") }],
      instant("08:00"),
    );
    expect(slots.map((slot) => slot.startsAt)).toEqual(
      ["09:00", "10:30", "14:30"].map((time) => new Date(instant(time)).toISOString()),
    );
  });
  it("never offers a past start or a slot extending beyond closing", () => {
    expect(buildSlots(hours, 60, [], instant("16:00"))).toEqual([]);
    expect(buildSlots(hours, 241, [], instant("08:00"))).toEqual([]);
  });
});
