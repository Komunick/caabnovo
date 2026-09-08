import { describe, expect, it } from "vitest";
import {
  AdminMfaRequiredError,
  assertAdministrativeMfa,
  administrativeAccessAllowed,
} from "./admin-mfa-policy";

describe("administrative MFA policy", () => {
  it("does not require a second factor from a non-administrative identity", () => {
    expect(
      administrativeAccessAllowed({
        hasAdministrativeRole: false,
        twoFactorEnabled: false,
        challengeVerified: false,
      }),
    ).toBe(true);
  });

  it.each([
    [false, false],
    [true, false],
    [false, true],
  ])(
    "denies an administrator unless the factor is enabled and verified (%s, %s)",
    (twoFactorEnabled, challengeVerified) => {
      const state = { hasAdministrativeRole: true, twoFactorEnabled, challengeVerified };
      expect(administrativeAccessAllowed(state)).toBe(false);
      expect(() => assertAdministrativeMfa(state)).toThrow(AdminMfaRequiredError);
    },
  );

  it("allows an administrator only after a verified challenge", () => {
    const state = {
      hasAdministrativeRole: true,
      twoFactorEnabled: true,
      challengeVerified: true,
    };
    expect(administrativeAccessAllowed(state)).toBe(true);
    expect(assertAdministrativeMfa(state)).toEqual(state);
  });
});
