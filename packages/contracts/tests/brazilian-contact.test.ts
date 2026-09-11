import { describe, expect, it } from "vitest";
import {
  brazilianPhoneSchema,
  contactEmailSchema,
  requiredEmailSchema,
  contactWebsiteSchema,
  postalCodeSchema,
  brazilianStateSchema,
} from "../src/brazilian-contact";
describe("shared Brazilian contact contracts", () => {
  it("normalizes complete landline/mobile numbers while rejecting letters and incomplete numbers", () => {
    expect(brazilianPhoneSchema.parse("(71) 3333-4444")).toBe("7133334444");
    expect(brazilianPhoneSchema.parse("(71) 99999-8888")).toBe("71999998888");
    for (const invalid of ["71333", "713333444455", "71ABCD4444", "0033334444"])
      expect(brazilianPhoneSchema.safeParse(invalid).success).toBe(false);
    expect(brazilianPhoneSchema.parse("")).toBe("");
  });
  it("validates e-mail and http/https websites with clear optionality", () => {
    expect(requiredEmailSchema.parse(" nome@example.test ")).toBe("nome@example.test");
    expect(requiredEmailSchema.safeParse("").success).toBe(false);
    expect(contactEmailSchema.parse("")).toBe("");
    for (const invalid of ["nome", "nome@", "nome@invalid", "@example.test"])
      expect(contactEmailSchema.safeParse(invalid).success).toBe(false);
    for (const invalid of [
      "javascript:alert(1)",
      "ftp://example.test",
      "www.example.test",
      "https://",
    ])
      expect(contactWebsiteSchema.safeParse(invalid).success).toBe(false);
    expect(contactWebsiteSchema.parse("https://example.test/path")).toBe(
      "https://example.test/path",
    );
  });
  it("normalizes CEP and UF without inventing an address", () => {
    expect(postalCodeSchema.parse("40020-000")).toBe("40020000");
    expect(brazilianStateSchema.parse("ba")).toBe("BA");
    expect(postalCodeSchema.safeParse("40020").success).toBe(false);
    expect(brazilianStateSchema.safeParse("ZZ").success).toBe(false);
  });
});
