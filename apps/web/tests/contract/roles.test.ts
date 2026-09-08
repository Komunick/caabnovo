import { describe, expect, it, vi } from "vitest";
import { roleChangeRequestSchema, roleSchema } from "@caab/contracts";
import { createRolesRoute } from "../../modules/users/http/roles-route";

describe("roles contracts", () => {
  it("validates roles with concrete permissions and bounded changes", () => {
    const role = roleSchema.parse({
      id: crypto.randomUUID(),
      code: "user-manager",
      name: "Gestor de usuários",
      administrative: false,
      permissions: ["users:read", "users:update"],
    });
    expect(role.permissions).toEqual(["users:read", "users:update"]);
    expect(
      roleChangeRequestSchema.safeParse({
        justification: "Atribuição temporária",
        validUntil: new Date(Date.now() + 60_000).toISOString(),
      }).success,
    ).toBe(true);
    expect(roleChangeRequestSchema.safeParse({ justification: " " }).success).toBe(false);
  });

  it("returns a contract-valid role list and rejects an invalid page limit", async () => {
    const role = roleSchema.parse({
      id: crypto.randomUUID(),
      code: "viewer",
      name: "Consulta",
      administrative: false,
      permissions: ["users:read"],
    });
    const route = createRolesRoute({
      resolveActor: async () => ({
        userId: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        permissions: new Set(["roles:read"]),
        mfaVerified: false,
      }),
      list: vi.fn(async () => [role]),
    });
    const response = await route.GET(new Request("https://caab.example.test/api/v1/roles"));
    expect(response.status).toBe(200);
    expect(roleSchema.array().parse(await response.json())).toEqual([role]);
  });
});
