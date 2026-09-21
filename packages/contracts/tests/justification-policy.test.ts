import { describe, expect, it } from "vitest";
import {
  createMemberSchema,
  memberCommandSchema,
  createUserRequestSchema,
  updateUserRequestSchema,
  createNewsDraftRequestSchema,
  updateNewsDraftRequestSchema,
  restoreNewsRevisionRequestSchema,
  publishNewsRequestSchema,
  accountSettingsRequestSchema,
  emptyNewsBody,
  roleChangeRequestSchema,
  userAccessChangeSchema,
  auditExportRequestSchema,
  redriveJobRequestSchema,
  partnerAppSettingsSchema,
  moderatePartnerReviewSchema,
} from "../src/index";

const id = "11111111-1111-4111-8111-111111111111";
describe("creation and edit justification policy", () => {
  it("accepts new records without an operator justification", () => {
    expect(createMemberSchema.safeParse({ profile: { name: "Pessoa sintética" } }).success).toBe(
      true,
    );
    expect(
      createUserRequestSchema.safeParse({
        name: "Pessoa sintética",
        email: "test@example.test",
        cpf: "52998224725",
        phone: "71999990000",
        address: {
          postalCode: "40000000",
          street: "Rua Teste",
          number: "s/n",
          neighborhood: "Centro",
          city: "Salvador",
          state: "BA",
        },
        roleIds: [],
      }).success,
    ).toBe(true);
    expect(createNewsDraftRequestSchema.safeParse({ metadata: {} }).success).toBe(true);
    expect(
      memberCommandSchema.safeParse({
        action: "link",
        dependentId: id,
        relationship: "Dependente",
        startsOn: "2020-01-01",
        expectedVersion: 1,
      }).success,
    ).toBe(true);
    expect(
      memberCommandSchema.safeParse({
        action: "document",
        fileId: id,
        category: "Identificação",
        expectedVersion: 1,
      }).success,
    ).toBe(true);
  });
  const changes = [
    [updateUserRequestSchema, { name: "Atualizado", version: 1 }],
    [
      memberCommandSchema,
      { action: "update", profile: { name: "Atualizado" }, expectedVersion: 1 },
    ],
    [
      memberCommandSchema,
      {
        action: "document",
        fileId: id,
        replacesId: id,
        category: "Identificação",
        expectedVersion: 1,
      },
    ],
    [updateNewsDraftRequestSchema, { metadata: {}, body: emptyNewsBody, expectedVersion: 1 }],
    [restoreNewsRevisionRequestSchema, { expectedVersion: 1, versionId: id }],
    [publishNewsRequestSchema, { expectedVersion: 1, channels: ["site"] }],
    [accountSettingsRequestSchema, { action: "profile", name: "Atualizado", version: 1 }],
    [roleChangeRequestSchema, {}],
    [userAccessChangeSchema, { permissions: [], expectedPermissions: [], version: 0 }],
    [auditExportRequestSchema, { from: "2026-09-01T00:00:00Z", to: "2026-09-14T00:00:00Z" }],
    [partnerAppSettingsSchema, { expectedVersion: 1, mode: "all", categoryIds: [] }],
    [moderatePartnerReviewSchema, { expectedVersion: 1, status: "hidden" }],
  ] as const;
  it.each(changes)("accepts missing and blank reasons for changes (%#)", (schema, command) => {
    for (const justification of [undefined, "", "   "]) {
      expect(schema.safeParse({ ...command, justification }).success).toBe(true);
    }
    expect(schema.safeParse({ ...command, justification: "Correção solicitada" }).success).toBe(
      true,
    );
    expect(schema.safeParse({ ...command, justification: "a".repeat(1001) }).success).toBe(false);
  });
  it("requeues jobs without a reason while bounding legacy text", () => {
    for (const reason of [undefined, "", "   "])
      expect(redriveJobRequestSchema.parse({ reason }).reason).toBe("");
    expect(redriveJobRequestSchema.safeParse({ reason: "a".repeat(501) }).success).toBe(false);
  });
});
