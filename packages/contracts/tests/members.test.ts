import { describe, expect, it } from "vitest";
import {
  createMemberSchema,
  memberCommandSchema,
  memberListSchema,
  isValidCpf,
} from "../src/members";

describe("member contracts", () => {
  it.each(["activate", "block", "unblock"])(
    "requires justification and version for %s",
    (action) => {
      const input = { action, expectedVersion: 1, justification: "Decisão administrativa" };
      expect(memberCommandSchema.safeParse(input).success).toBe(true);
      for (const extra of [
        { justification: " " },
        { expectedVersion: 0 },
        { administrativeStatus: "active" },
      ])
        expect(memberCommandSchema.safeParse({ ...input, ...extra }).success).toBe(false);
    },
  );
  it("validates the independent administrative filter", () => {
    for (const administrativeStatus of ["inactive", "active", "blocked"])
      expect(memberListSchema.parse({ administrativeStatus }).administrativeStatus).toBe(
        administrativeStatus,
      );
    expect(memberListSchema.safeParse({ administrativeStatus: "approved" }).success).toBe(false);
  });
  it("accepts only known OAB sections and combines them with list filters", () => {
    expect(
      memberListSchema.parse({
        q: "Pessoa",
        oabState: "BA",
        page: "2",
        archived: "all",
        registrationStatus: "pending",
      }),
    ).toEqual({
      q: "Pessoa",
      oabState: "BA",
      page: 2,
      archived: "all",
      registrationStatus: "pending",
    });
    expect(memberListSchema.parse({}).oabState).toBeUndefined();
    for (const oabState of ["XX", "ba", ["BA", "SP"]])
      expect(memberListSchema.safeParse({ oabState }).success).toBe(false);
  });
  it("validates CPF digits and normalizes formatting", () => {
    expect(isValidCpf("52998224725")).toBe(true);
    for (const cpf of ["11111111111", "52998224726", "123", "abcdef"])
      expect(isValidCpf(cpf)).toBe(false);
    expect(
      createMemberSchema.parse({
        profile: { name: "Pessoa sintética", cpf: "529.982.247-25" },
        justification: "Cadastro de teste",
      }).profile.cpf,
    ).toBe("52998224725");
  });
  it("does not accept login roles or financial balances as profile fields", () => {
    for (const extra of [{ password: "irrelevant" }, { roleIds: [] }, { balance: 1 }])
      expect(
        createMemberSchema.safeParse({
          profile: { name: "Teste", ...extra },
          justification: "Teste",
        }).success,
      ).toBe(false);
  });
  it("requires source, matching dimension and credential expiry", () => {
    const input = {
      action: "assess",
      expectedVersion: 1,
      justification: "Análise manual",
      dimension: "credential",
      result: "valid",
      source: "Política sintética",
      observedAt: "2026-01-01T00:00:00Z",
    };
    expect(memberCommandSchema.safeParse(input).success).toBe(false);
    expect(
      memberCommandSchema.safeParse({ ...input, validUntil: "2027-01-01T00:00:00Z" }).success,
    ).toBe(true);
    expect(
      memberCommandSchema.safeParse({ ...input, dimension: "oab", result: "approved" }).success,
    ).toBe(false);
  });
  it("rejects future birth and self-invented state values", () => {
    expect(
      createMemberSchema.safeParse({
        profile: { name: "Teste", birthDate: "2999-01-01" },
        justification: "Teste",
      }).success,
    ).toBe(false);
    expect(
      memberCommandSchema.safeParse({
        action: "assess",
        expectedVersion: 1,
        justification: "Teste",
        dimension: "eligibility",
        result: "automatic",
        source: "Teste",
        observedAt: "2026-01-01T00:00:00Z",
      }).success,
    ).toBe(false);
  });
});
