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
  ] as const;
  it.each(changes)("rejects missing and blank reasons for changes (%#)", (schema, command) => {
    for (const justification of [undefined, "", "   "]) {
      expect(schema.safeParse({ ...command, justification }).success).toBe(false);
    }
    expect(schema.safeParse({ ...command, justification: "Correção solicitada" }).success).toBe(
      true,
    );
  });
});
