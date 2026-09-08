import { describe, expect, it } from "vitest";
import { currentUserSchema } from "@caab/contracts";
import { createCurrentUserRoute, type CurrentUserIdentity } from "../../modules/auth/current-user";

const identity: CurrentUserIdentity = {
  id: crypto.randomUUID(),
  email: "ordinary@example.test",
  name: "Ordinary User",
  status: "active",
  twoFactorEnabled: false,
  roles: [],
  permissions: ["users:read"],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: null,
};

describe("GET /api/v1/me contract", () => {
  it("returns the current effective identity", async () => {
    const route = createCurrentUserRoute(async () => identity);
    const response = await route(new Request("https://caab.example.test/api/v1/me"));

    expect(response.status).toBe(200);
    expect(currentUserSchema.parse(await response.json())).toEqual(identity);
  });

  it("returns an enumeration-safe 401 without protected data", async () => {
    const route = createCurrentUserRoute(async () => null);
    const response = await route(
      new Request("https://caab.example.test/api/v1/me", {
        headers: { "x-request-id": crypto.randomUUID() },
      }),
    );
    const payload = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(401);
    expect(payload).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
    expect(JSON.stringify(payload)).not.toMatch(/ordinary@example\.test|session|token|permission/i);
  });

  it("maps an authorization denial to a safe 403", async () => {
    const route = createCurrentUserRoute(async () => {
      throw Object.assign(new Error("internal permission detail"), { status: 403 });
    });
    const response = await route(new Request("https://caab.example.test/api/v1/me"));
    const payload = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(403);
    expect(payload).toMatchObject({ code: "PERMISSION_DENIED", message: "Permission denied" });
    expect(JSON.stringify(payload)).not.toContain("internal permission detail");
  });
});
