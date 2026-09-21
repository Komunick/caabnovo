import { describe, expect, it, vi } from "vitest";
import { createResetPasswordRoute } from "../../modules/users/http/reset-password-route";

const origin = "https://panel.example.test";
const userId = crypto.randomUUID();
const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(["users:read", "users:reset-password"]),
};
const request = (body: unknown = { version: 3 }, trusted = true) =>
  new Request(`${origin}/api/v1/users/${userId}/reset-password`, {
    method: "POST",
    headers: {
      origin: trusted ? origin : "https://outside.example.test",
      "content-type": "application/json",
      "x-csrf-token": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
describe("administrative password replacement contract", () => {
  it("requires session, all management permissions, trusted origin and exact versioned body", async () => {
    const reset = vi.fn(async () => ({ initialPassword: "Caderno000007", version: 4 }));
    expect(
      (await createResetPasswordRoute({ resolveActor: async () => null, reset })(request(), userId))
        .status,
    ).toBe(401);
    for (const permission of actor.permissions) {
      const route = createResetPasswordRoute({
        resolveActor: async () => ({
          ...actor,
          permissions: new Set([...actor.permissions].filter((p) => p !== permission)),
        }),
        reset,
      });
      expect((await route(request(), userId)).status).toBe(403);
    }
    const route = createResetPasswordRoute({ resolveActor: async () => actor, reset });
    expect((await route(request({}, false), userId)).status).toBe(403);
    for (const body of [{}, { version: 0 }, { version: 3, password: "chosen" }])
      expect((await route(request(body), userId)).status).toBe(422);
    expect(reset).not.toHaveBeenCalled();
    const result = await route(request(), userId);
    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(await result.json()).toEqual({ initialPassword: "Caderno000007", version: 4 });
    expect(reset).toHaveBeenCalledWith(expect.objectContaining({ userId, version: 3 }));
  });
  it("does not expose secrets in errors", async () => {
    const route = createResetPasswordRoute({
      resolveActor: async () => actor,
      reset: async () => {
        throw Object.assign(new Error("Caderno000007"), {
          status: 409,
          code: "USER_VERSION_CONFLICT",
        });
      },
    });
    const result = await route(request(), userId);
    expect(result.status).toBe(409);
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(await result.text()).not.toContain("Caderno000007");
  });
});
