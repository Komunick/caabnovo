import { describe, expect, it } from "vitest";
import {
  isValidCnpj,
  partnerProfileSchema,
  partnerCommandSchema,
  benefitDraftSchema,
  benefitPublicationSchema,
  partnerListSchema,
  createPartnerSchema,
  partnerUnitSchema,
} from "../src/partners";
import { accessPermissionSchema, userAccessChangeSchema } from "../src/user-access";

describe("partner contracts", () => {
  it("allows creation without a reason but requires one for partner and unit edits", () => {
    const profile = { name: "Parceiro sintético", category: "Teste" };
    expect(createPartnerSchema.safeParse({ profile }).success).toBe(true);
    const unit = {
      action: "unit",
      expectedVersion: 1,
      profile: { name: "Unidade", mode: "presential" },
      active: true,
    };
    expect(partnerCommandSchema.safeParse(unit).success).toBe(true);
    expect(partnerCommandSchema.safeParse({ ...unit, unitId: crypto.randomUUID() }).success).toBe(
      false,
    );
    expect(
      partnerCommandSchema.safeParse({ action: "update", profile, expectedVersion: 1 }).success,
    ).toBe(false);
    expect(
      partnerUnitSchema.parse({
        ...unit.profile,
        postalCode: "40020-000",
        phone: "(71) 3333-4444",
        state: "ba",
      }),
    ).toMatchObject({ postalCode: "40020000", phone: "7133334444", state: "BA" });
    for (const extra of [
      { email: "email-invalido" },
      { website: "ftp://example.test" },
      { postalCode: "123" },
      { phone: "telefone" },
      { state: "ZZ" },
    ])
      expect(partnerProfileSchema.safeParse({ ...profile, ...extra }).success).toBe(false);
  });
  it("accepts both CNPJ formats and preserves initial zeroes", () => {
    for (const cnpj of ["12ABC34501DE35", "04252011000110"]) expect(isValidCnpj(cnpj)).toBe(true);
    expect(
      partnerProfileSchema.parse({ name: "Exemplo", category: "Saúde", cnpj: "12.abc.345/01de-35" })
        .cnpj,
    ).toBe("12ABC34501DE35");
    for (const cnpj of [
      "00000000000000",
      "12ABC34501DE36",
      "12ABC34501DEAA",
      "123",
      "04252011000111",
    ])
      expect(isValidCnpj(cnpj)).toBe(false);
    for (const cnpj of ["12!ABC34501DE35", "12 ABC34501DE35"])
      expect(
        partnerProfileSchema.safeParse({ name: "Exemplo", category: "Saúde", cnpj }).success,
      ).toBe(false);
  });
  it("rejects unsafe links and unknown account fields", () => {
    for (const extra of [{ website: "javascript:alert(1)" }, { roleIds: [] }, { category: "" }])
      expect(
        partnerProfileSchema.safeParse({ name: "Exemplo", category: "Saúde", ...extra }).success,
      ).toBe(false);
  });
  it("allows incomplete drafts but requires complete publication", () => {
    expect(benefitDraftSchema.safeParse({ title: "Oferta" }).success).toBe(true);
    expect(benefitPublicationSchema.safeParse({ title: "Oferta" }).success).toBe(false);
    const complete = {
      title: "Oferta",
      description: "Descrição",
      conditions: "Condições",
      audience: "Público",
      unitId: crypto.randomUUID(),
      contractId: crypto.randomUUID(),
      startsOn: "2026-09-01",
      endsOn: "2026-09-30",
      channels: ["site"],
    };
    expect(benefitPublicationSchema.safeParse(complete).success).toBe(true);
    for (const extra of [
      { endsOn: "2026-08-31" },
      { startsOn: "2026-02-30" },
      { channels: ["site", "site"] },
      { channels: [] },
    ])
      expect(benefitPublicationSchema.safeParse({ ...complete, ...extra }).success).toBe(false);
  });
  it("allows new contracts without a reason and requires valid versions and civil dates", () => {
    const input = {
      action: "contract",
      expectedVersion: 1,
      justification: "Registro de teste",
      contract: {
        reference: "Contrato",
        terms: "Condições",
        startsOn: "2026-09-01",
        endsOn: "2026-09-01",
      },
    };
    expect(partnerCommandSchema.safeParse(input).success).toBe(true);
    for (const extra of [
      { expectedVersion: 0 },
      { action: "delete" },
      { contract: { ...input.contract, endsOn: "2026-08-01" } },
    ])
      expect(partnerCommandSchema.safeParse({ ...input, ...extra }).success).toBe(false);
    expect(partnerListSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(partnerCommandSchema.safeParse({ ...input, justification: undefined }).success).toBe(
      true,
    );
  });
  it("requires reasons for benefit edits and every state transition, but not new drafts", () => {
    const id = crypto.randomUUID();
    const draft = { action: "benefit", expectedVersion: 1, draft: { title: "Oferta" } };
    expect(partnerCommandSchema.safeParse(draft).success).toBe(true);
    const edits = [
      { ...draft, benefitId: id },
      { action: "contract-status", contractId: id, status: "approved" },
      { action: "contract-status", contractId: id, status: "ended" },
      { action: "publish", benefitId: id },
      { action: "hide", benefitId: id },
      { action: "status", status: "suspended" },
      { action: "archive" },
      { action: "restore" },
    ];
    for (const edit of edits) {
      for (const justification of [undefined, "", "  ", "ab"])
        expect(
          partnerCommandSchema.safeParse({ expectedVersion: 1, ...edit, justification }).success,
        ).toBe(false);
      expect(
        partnerCommandSchema.safeParse({
          expectedVersion: 1,
          ...edit,
          justification: "Alteração sintética",
        }).success,
      ).toBe(true);
    }
  });
  it("allows all permissions and requires read before publishing partners", () => {
    const base = { version: 0, expectedPermissions: [], justification: "Acesso de teste" };
    expect(
      userAccessChangeSchema.safeParse({ ...base, permissions: accessPermissionSchema.options })
        .success,
    ).toBe(true);
    expect(
      userAccessChangeSchema.safeParse({ ...base, permissions: ["partners:publish"] }).success,
    ).toBe(false);
    expect(
      userAccessChangeSchema.safeParse({
        ...base,
        permissions: ["partners:read", "partners:publish"],
      }).success,
    ).toBe(true);
  });
});
