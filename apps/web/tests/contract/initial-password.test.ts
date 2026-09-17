import { describe, expect, it, vi } from "vitest";
import { createdUserSchema, userSchema } from "@caab/contracts";
import { createInitialPasswordRoute } from "../../modules/users/http/initial-password-route";
import { createUsersRoute } from "../../modules/users/http/users-route";
import { redactSensitive } from "@caab/config/redaction";

const origin = "https://panel.example.test";
const userId = crypto.randomUUID();
const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(["users:create", "users:update", "roles:grant"]),
};
const password = "Caderno000007";
const created = {
  id: userId,
  email: "synthetic@example.test",
  name: "Synthetic",
  status: "active",
  twoFactorEnabled: false,
  roles: [],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: null,
  initialPassword: password,
};
function request(trusted = true) {
  return new Request(`${origin}/api/v1/users/${userId}/initial-password`, {
    method: "POST",
    headers: {
      origin: trusted ? origin : "https://outside.example.test",
      "x-csrf-token": crypto.randomUUID(),
    },
  });
}
describe("initial password HTTP contract", () => {
  it("returns secrets only on creation and explicitly prevents caching", async () => {
    const route = createUsersRoute({
      resolveActor: async () => actor,
      list: vi.fn(),
      create: async () => createdUserSchema.parse(created),
    });
    const req = new Request(`${origin}/api/v1/users`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        "x-csrf-token": crypto.randomUUID(),
        "idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({ name: created.name, email: created.email, roleIds: [] }),
    });
    const response = await route.POST(req);
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect((await response.json()).initialPassword).toBe(password);
    expect(userSchema.parse(created)).not.toHaveProperty("initialPassword");
    expect(redactSensitive({ initialPassword: password })).toEqual({
      initialPassword: "[REDACTED]",
    });
  });
  it("requires authentication, each management permission and trusted origin before initializing", async () => {
    const initialize = vi.fn(async () => ({ initialPassword: password }));
    const anonymous = createInitialPasswordRoute({ resolveActor: async () => null, initialize });
    expect((await anonymous(request(), userId)).status).toBe(401);
    for (const missing of actor.permissions) {
      const denied = createInitialPasswordRoute({
        resolveActor: async () => ({
          ...actor,
          permissions: new Set([...actor.permissions].filter((p) => p !== missing)),
        }),
        initialize,
      });
      expect((await denied(request(), userId)).status).toBe(403);
    }
    const allowed = createInitialPasswordRoute({ resolveActor: async () => actor, initialize });
    expect((await allowed(request(false), userId)).status).toBe(403);
    expect(initialize).not.toHaveBeenCalled();
    const response = await allowed(request(), userId);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("does not leak an existing credential through conflict responses", async () => {
    const route = createInitialPasswordRoute({
      resolveActor: async () => actor,
      initialize: async () => {
        throw Object.assign(new Error(password), { code: "PASSWORD_ALREADY_DEFINED", status: 409 });
      },
    });
    const response = await route(request(), userId);
    expect(response.status).toBe(409);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.text()).not.toContain(password);
  });
});
