import { describe, expect, it, vi } from "vitest";
import { roleChangeRequestSchema, roleSchema } from "@caab/contracts";
import { createPromoteRoleRoute } from "../../modules/users/http/promote-role-route";
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
    expect(roleChangeRequestSchema.safeParse({ justification: " " }).success).toBe(true);
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

it("protects promotion against unauthenticated, cross-origin and malformed requests and preserves conflicts", async () => {
  const userId = crypto.randomUUID(),
    roleId = crypto.randomUUID();
  const actor = {
    userId,
    sessionId: crypto.randomUUID(),
    permissions: new Set(["roles:grant", "roles:revoke"]),
  };
  const promote = vi.fn(async () => {});
  const route = createPromoteRoleRoute({ resolveActor: async () => actor, promote });
  const request = (
    headers: Record<string, string> = {
      origin: "https://caab.example.test",
      "x-csrf-token": crypto.randomUUID(),
    },
  ) =>
    new Request("https://caab.example.test/api/v1/users/test/roles/test/promote", {
      method: "POST",
      headers,
    });
  expect(
    (
      await createPromoteRoleRoute({ resolveActor: async () => null, promote }).POST(
        request(),
        userId,
        roleId,
      )
    ).status,
  ).toBe(401);
  expect(
    (
      await route.POST(
        request({ origin: "https://other.example.test", "x-csrf-token": crypto.randomUUID() }),
        userId,
        roleId,
      )
    ).status,
  ).toBe(403);
  expect(
    (await route.POST(request({ origin: "https://caab.example.test" }), userId, roleId)).status,
  ).toBe(403);
  expect((await route.POST(request(), userId, "invalid")).status).toBe(422);
  expect(promote).not.toHaveBeenCalled();
  expect((await route.POST(request(), userId, roleId)).status).toBe(204);
  expect(promote).toHaveBeenCalledWith(expect.objectContaining({ targetUserId: userId, roleId }));
  promote.mockRejectedValueOnce(
    Object.assign(new Error("changed"), { code: "ROLE_PROMOTION_CONFLICT", status: 409 }),
  );
  const conflict = await route.POST(request(), userId, roleId);
  expect(conflict.status).toBe(409);
  expect(await conflict.json()).toMatchObject({ code: "ROLE_PROMOTION_CONFLICT" });
});
