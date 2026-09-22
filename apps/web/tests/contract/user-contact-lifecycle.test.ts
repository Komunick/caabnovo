import { describe, expect, it, vi } from "vitest";
import { memberCommandSchema, userLifecycleSchema, userListQuerySchema } from "@caab/contracts";
import { createUserCpfLookupRoute } from "../../modules/users/http/user-cpf-lookup-route";
import { createUserLifecycleRoute } from "../../modules/users/http/user-lifecycle-route";
import { syntheticUserContact } from "../helpers/user-contact";

const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(["users:create", "users:read", "users:update", "users:delete"]),
};
function request(body: unknown) {
  return new Request("https://caab.example.test/api/v1/users/lookup-cpf", {
    method: "POST",
    headers: {
      origin: "https://caab.example.test",
      "x-csrf-token": crypto.randomUUID(),
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
describe("CPF lookup and deletion contracts", () => {
  it.each([undefined, "", "   ", "x".repeat(1001)])(
    "rejects invalid deletion reason %s in both modules",
    async (reason) => {
      expect(userLifecycleSchema.safeParse({ action: "delete", version: 1, reason }).success).toBe(
        false,
      );
      expect(
        memberCommandSchema.safeParse({
          action: "delete",
          expectedVersion: 1,
          justification: reason,
        }).success,
      ).toBe(false);
      const change = vi.fn();
      const route = createUserLifecycleRoute({ resolveActor: async () => actor, change });
      expect(
        (await route(request({ action: "delete", version: 1, reason }), crypto.randomUUID()))
          .status,
      ).toBe(422);
      expect(change).not.toHaveBeenCalled();
    },
  );
  it("trims deletion reasons but keeps restoration free of reasons and profile data", () => {
    expect(
      userLifecycleSchema.parse({ action: "delete", version: 1, reason: "  Encerramento  " }),
    ).toMatchObject({ reason: "Encerramento" });
    expect(userLifecycleSchema.safeParse({ action: "restore", version: 1 }).success).toBe(true);
    expect(
      userLifecycleSchema.safeParse({ action: "restore", version: 1, name: "Overwrite" }).success,
    ).toBe(false);
    expect(
      memberCommandSchema.safeParse({ action: "restore-deleted", expectedVersion: 1 }).success,
    ).toBe(true);
  });
  it.each([null, ["users:read"], ["users:create"]])(
    "protects lookup before calling storage (%s)",
    async (permissions) => {
      const lookup = vi.fn();
      const route = createUserCpfLookupRoute({
        resolveActor: async () =>
          permissions ? { ...actor, permissions: new Set(permissions) } : null,
        lookup,
      });
      expect((await route(request({ cpf: syntheticUserContact().cpf }))).status).toBe(
        permissions ? 403 : 401,
      );
      expect(lookup).not.toHaveBeenCalled();
    },
  );
  it("returns minimal noncached information and requires a trusted origin", async () => {
    const lookup = vi.fn().mockResolvedValue({
      status: "deleted",
      id: crypto.randomUUID(),
      version: 2,
      reason: null,
      canRestore: false,
    });
    const route = createUserCpfLookupRoute({ resolveActor: async () => actor, lookup });
    const response = await route(request({ cpf: syntheticUserContact().cpf }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(Object.keys(await response.json()).sort()).toEqual([
      "canRestore",
      "id",
      "reason",
      "status",
      "version",
    ]);
    const denied = request({ cpf: syntheticUserContact().cpf });
    denied.headers.set("origin", "https://outside.test");
    expect((await route(denied)).status).toBe(403);
  });
  it("validates filter values without accepting SQL or impossible dates", () => {
    expect(
      userListQuerySchema.safeParse({
        roleId: "none",
        deleted: "pending",
        createdFrom: "2026-09-01",
      }).success,
    ).toBe(true);
    expect(userListQuerySchema.safeParse({ roleId: "' OR TRUE" }).success).toBe(false);
    expect(userListQuerySchema.safeParse({ createdFrom: "2026-02-30" }).success).toBe(false);
  });
});
