import { describe, expect, it } from "vitest";
import { newPasswordSchema } from "./password-policy";

describe("new password policy", () => {
  it.each(["Aa1" + "a".repeat(9), "Aa1" + "a".repeat(69), "SenhaNova2026", "SenhaNova2026!"])(
    "accepts a valid password including boundaries",
    (password) => {
      expect(newPasswordSchema.safeParse(password).success).toBe(true);
    },
  );
  it.each([
    "Aa1" + "a".repeat(8),
    "Aa1" + "a".repeat(70),
    "senhasemmaiuscula2026",
    "SENHASEMMINUSCULA2026",
    "SenhaSemNumeros",
  ])("rejects invalid length or missing character groups", (password) => {
    expect(newPasswordSchema.safeParse(password).success).toBe(false);
  });
});
