import { describe, it, expect, vi } from "vitest";
import type { Pool } from "pg";
import { createMessagingRoute } from "./routes";
const id = crypto.randomUUID();
const invalidHeaders: Record<string, string>[] = [
  { origin: "https://evil.example.test" },
  { "x-csrf-token": "" },
  { "idempotency-key": "short" },
];
function setup(permissions: string[] | null = ["messages:access"]) {
  const connect = vi.fn();
  return {
    connect,
    route: createMessagingRoute({
      pool: { connect } as unknown as Pool,
      resolveActor: async () =>
        permissions ? { userId: id, sessionId: id, permissions: new Set(permissions) } : null,
    }),
  };
}
function request(method = "GET", headers: Record<string, string> = {}, body: unknown = {}) {
  return new Request("http://localhost/api/v1/messages/campaigns", {
    method,
    headers: {
      origin: "http://localhost",
      "content-type": "application/json",
      "x-csrf-token": id,
      "idempotency-key": id,
      ...headers,
    },
    ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
  });
}
describe("messages HTTP boundary", () => {
  it.each([
    ["campaigns"],
    ["templates"],
    ["audiences"],
    ["preferences"],
    ["recipients"],
    ["campaigns", id],
    ["campaigns", id, "history"],
  ])("protects %s", async (...path) => {
    for (const [permissions, status] of [
      [null, 401],
      [[], 403],
    ] as const) {
      const { route, connect } = setup(permissions === null ? null : [...permissions]);
      const response = await route(request(), path);
      expect(response.status).toBe(status);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(connect).not.toHaveBeenCalled();
    }
  });
  it.each(invalidHeaders)("rejects untrusted mutations", async (headers) => {
    const { route, connect } = setup();
    expect((await route(request("POST", headers), ["campaigns"])).status).toBe(
      headers["idempotency-key"] ? 422 : 403,
    );
    expect(connect).not.toHaveBeenCalled();
  });
  it("rejects oversized payload before opening a database transaction", async () => {
    const { route, connect } = setup();
    expect(
      (await route(request("POST", {}, { data: "x".repeat(70000) }), ["campaigns"])).status,
    ).toBe(413);
    expect(connect).not.toHaveBeenCalled();
  });
  it("rejects duplicated query parameters", async () => {
    const { route, connect } = setup();
    expect(
      (
        await route(new Request("http://localhost/api/v1/messages/campaigns?page=1&page=2"), [
          "campaigns",
        ])
      ).status,
    ).toBe(422);
    expect(connect).not.toHaveBeenCalled();
  });
});
