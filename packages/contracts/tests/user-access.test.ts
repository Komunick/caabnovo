import { describe, expect, it } from "vitest";
import { userAccessChangeSchema } from "../src/user-access";
const input = {
  permissions: ["members:read"],
  expectedPermissions: [],
  version: 0,
  justification: "Acesso de consulta",
};
describe("individual access contract", () => {
  it("accepts explicit empty access and valid action prerequisites", () => {
    expect(userAccessChangeSchema.parse({ ...input, permissions: [] }).permissions).toEqual([]);
    expect(
      userAccessChangeSchema.safeParse({ ...input, permissions: ["news:read", "news:write"] })
        .success,
    ).toBe(true);
  });
  it.each([
    ["news:publish"],
    ["members:review"],
    ["roles:grant"],
    ["unknown:write"],
    ["members:read", "members:read"],
  ])("rejects invalid selection %j", (...permissions) => {
    expect(userAccessChangeSchema.safeParse({ ...input, permissions }).success).toBe(false);
  });
  it("requires reason, expected version and rejects injected fields", () => {
    expect(userAccessChangeSchema.safeParse({ ...input, justification: " " }).success).toBe(false);
    expect(userAccessChangeSchema.safeParse({ ...input, version: -1 }).success).toBe(false);
    expect(userAccessChangeSchema.safeParse({ ...input, administrator: true }).success).toBe(false);
  });
});
