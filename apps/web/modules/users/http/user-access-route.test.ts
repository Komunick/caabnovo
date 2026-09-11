import { describe, expect, it, vi } from "vitest";
import { createUserAccessRoute } from "./user-access-route";
const id = crypto.randomUUID();
const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(["users:read", "roles:grant", "roles:revoke"]),
};
const input = {
  permissions: ["members:read"],
  expectedPermissions: [],
  version: 0,
  justification: "Consulta autorizada",
};
const request = (changes: Record<string, string> = {}) =>
  new Request(`http://localhost:3000/api/v1/users/${id}/access`, {
    method: "PUT",
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
      "x-csrf-token": crypto.randomUUID(),
      ...changes,
    },
    body: JSON.stringify(input),
  });
describe("individual access route", () => {
  it("sends validated input and trusted actor to the service", async () => {
    const change = vi.fn().mockResolvedValue({ version: 1, permissions: input.permissions });
    const route = createUserAccessRoute({ resolveActor: async () => actor, change });
    const response = await route(request(), id);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ actor, input, targetUserId: id }),
    );
  });
  it("denies anonymous, unauthorized, foreign origin and missing CSRF before saving", async () => {
    const change = vi.fn();
    expect(
      (await createUserAccessRoute({ resolveActor: async () => null, change })(request(), id))
        .status,
    ).toBe(401);
    expect(
      (
        await createUserAccessRoute({
          resolveActor: async () => ({ ...actor, permissions: new Set() }),
          change,
        })(request(), id)
      ).status,
    ).toBe(403);
    const route = createUserAccessRoute({ resolveActor: async () => actor, change });
    expect((await route(request({ origin: "https://foreign.test" }), id)).status).toBe(403);
    expect((await route(request({ "x-csrf-token": "" }), id)).status).toBe(403);
    expect(change).not.toHaveBeenCalled();
  });
});
