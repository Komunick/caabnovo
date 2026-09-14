import { expect, it } from "vitest";
import { memberProfileSchema } from "./members";
import { oabNumberSchema } from "./oab-lookup";

it("shares the six-digit OAB contract between profile and standalone lookup", () => {
  for (const number of ["1", "001234", "999999"]) {
    expect(oabNumberSchema.safeParse(number).success).toBe(true);
    expect(
      memberProfileSchema.safeParse({
        name: "Pessoa sintética",
        oab: { number, state: "BA", type: "lawyer" },
      }).success,
    ).toBe(true);
  }
  for (const number of ["1234567", "12A", "12-34", "000000", ""]) {
    expect(oabNumberSchema.safeParse(number).success).toBe(false);
    expect(
      memberProfileSchema.safeParse({
        name: "Pessoa sintética",
        oab: { number, state: "BA", type: "lawyer" },
      }).success,
    ).toBe(false);
  }
});
