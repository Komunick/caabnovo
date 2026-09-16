import { describe, it, expect } from "vitest";
import {
  messageAudienceSchema,
  messageDataSchema,
  messageSaveSchema,
  messageCommandSchema,
  messagePreferenceSchema,
  messageQuerySchema,
  messageContentIssues,
  personalizeMessage,
  userAccessChangeSchema,
} from "../src";
describe("messaging contracts", () => {
  it("permits an incomplete draft but identifies send requirements", () => {
    const draft = messageDataSchema.parse({ name: "Campanha sintética" });
    expect(draft.body).toBe("");
    expect(messageContentIssues(draft)).toHaveLength(2);
  });
  it("allows only the two named variables and never recursively interpolates names", () => {
    expect(personalizeMessage("Olá {{primeiro_nome}} / {{nome}}", "Ana {{nome}}")).toBe(
      "Olá Ana / Ana {{nome}}",
    );
    expect(messageContentIssues({ subject: "Olá {{cpf}}", body: "Texto" })).toHaveLength(1);
    expect(
      messageContentIssues({ subject: "Olá {{nome}}", body: "Texto {{primeiro_nome}}" }),
    ).toEqual([]);
  });
  it("rejects duplicate IDs and malformed audience definitions", () => {
    const id = crypto.randomUUID();
    expect(messageAudienceSchema.safeParse({ memberIds: [id, id] }).success).toBe(false);
    expect(messageAudienceSchema.safeParse({ contact: "whatsapp" }).success).toBe(false);
    expect(messageAudienceSchema.safeParse({ state: "Bahia" }).success).toBe(false);
    expect(messageAudienceSchema.safeParse({ state: "ZZ" }).success).toBe(false);
  });
  it.each([
    { action: "send", scheduledAt: "2030-01-01T10:00:00Z" },
    { action: "schedule" },
    { action: "deliver" },
  ])("rejects unsupported command $action", (input) => {
    expect(messageCommandSchema.safeParse({ expectedVersion: 1, ...input }).success).toBe(false);
  });
  it("requires versions and a reason for communication preferences", () => {
    expect(
      messagePreferenceSchema.safeParse({ blocked: true, reason: "", expectedVersion: 0 }).success,
    ).toBe(false);
    expect(messageSaveSchema.safeParse({ data: { name: "Teste" } }).success).toBe(false);
    expect(messageQuerySchema.safeParse({ pageSize: 10000 }).success).toBe(false);
  });
  it("one module permission grants all preparation actions without prerequisites", () => {
    expect(
      userAccessChangeSchema.safeParse({
        permissions: ["messages:access"],
        expectedPermissions: [],
        version: 0,
      }).success,
    ).toBe(true);
  });
});

it("accepts 100 manual recipients and compatible legacy audiences without a 500-person cap", () => {
  const ids = Array.from({ length: 100 }, () => crypto.randomUUID());
  expect(messageAudienceSchema.parse({ memberIds: ids }).memberIds).toHaveLength(100);
  expect(messageAudienceSchema.parse({ excludedIds: ids }).excludedIds).toHaveLength(100);
  expect(
    messageAudienceSchema.parse({ state: "BA", contact: "email", memberIds: [], excludedIds: [] }),
  ).toMatchObject({
    residenceState: "",
    administrativeStatus: "any",
    minAge: null,
    relationship: "any",
  });
});
it("validates inclusive ages, administrative status and demographic values", () => {
  expect(messageAudienceSchema.safeParse({ minAge: 40, maxAge: 20 }).success).toBe(false);
  expect(messageAudienceSchema.safeParse({ minAge: -1 }).success).toBe(false);
  expect(messageAudienceSchema.safeParse({ gender: "inferred" }).success).toBe(false);
  expect(messageAudienceSchema.safeParse({ residenceState: "ZZ" }).success).toBe(false);
  expect(
    messageAudienceSchema.parse({
      minAge: 0,
      maxAge: 0,
      administrativeStatus: "inactive",
      gender: "female",
    }).minAge,
  ).toBe(0);
  expect(
    messageCommandSchema.safeParse({
      action: "reschedule",
      expectedVersion: 1,
      scheduledAt: "2030-01-01T10:00:00Z",
    }).success,
  ).toBe(true);
  expect(messageCommandSchema.safeParse({ action: "reschedule", expectedVersion: 1 }).success).toBe(
    false,
  );
});
