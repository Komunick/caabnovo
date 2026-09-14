import { describe, expect, it } from "vitest";
import { brazilianAddressSchema, formatBrazilianAddress } from "./brazilian-address";

describe("structured Brazilian addresses", () => {
  it("keeps legacy text intact without guessing street or house number", () => {
    const address = brazilianAddressSchema.parse({ address: "Rua antiga, 12, fundos" });
    expect(address.street).toBe("");
    expect(formatBrazilianAddress(address)).toBe("Rua antiga, 12, fundos");
  });
  it("validates independent parts and formats compatible public text", () => {
    const address = brazilianAddressSchema.parse({
      street: " Rua Teste ",
      neighborhood: "Centro",
      number: "12A",
      complement: "Sala 2",
    });
    expect(formatBrazilianAddress(address)).toBe("Rua Teste, 12A, Sala 2, Centro");
    expect(brazilianAddressSchema.safeParse({ number: "s/n" }).success).toBe(true);
    expect(brazilianAddressSchema.safeParse({ neighborhood: "x".repeat(101) }).success).toBe(false);
    expect(brazilianAddressSchema.safeParse({ complement: "x".repeat(151) }).success).toBe(false);
  });
});
