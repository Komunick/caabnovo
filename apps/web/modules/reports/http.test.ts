import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { createReportsRoute } from "./http";
import { createCollectionRoute } from "./ingest";
const pool = { query: vi.fn(), connect: vi.fn() } as unknown as Pool;
const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set<string>(),
};
describe("reports HTTP boundaries", () => {
  it("rejects unauthenticated and unprivileged readers before querying", async () => {
    for (const identity of [null, actor]) {
      const route = createReportsRoute({
        pool,
        resolveActor: async () => identity,
        enqueue: vi.fn(),
      });
      expect((await route(new Request("https://caab.test/api/v1/reports"))).status).toBe(
        identity ? 403 : 401,
      );
    }
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("does not expand source access from reports:read", async () => {
    const route = createReportsRoute({
      pool,
      resolveActor: async () => ({ ...actor, permissions: new Set(["reports:read"]) }),
      enqueue: vi.fn(),
    });
    const q = encodeURIComponent(
      JSON.stringify({ view: "details", dataset: "members", from: "2026-09-01", to: "2026-09-18" }),
    );
    expect((await route(new Request(`https://caab.test/api/v1/reports?q=${q}`))).status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("requires backend source token and refuses impersonation/conclusion by the panel", async () => {
    const request = (body: object) =>
      new Request("https://caab.test/api/v1/reports/collect", {
        method: "POST",
        headers: {
          origin: "https://caab.test",
          "x-csrf-token": "a".repeat(32),
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
    const deps = { pool, resolveActor: async () => actor, secret: "s".repeat(32) };
    expect((await createCollectionRoute(deps, true)(request({}))).status).toBe(401);
    for (const extra of [
      { accountId: crypto.randomUUID() },
      { event: "booking_confirmed" },
      { email: "private@example.test" },
    ]) {
      const response = await createCollectionRoute(deps)(
        request({
          id: crypto.randomUUID(),
          visitorId: crypto.randomUUID(),
          sessionId: crypto.randomUUID(),
          event: "page_view",
          screen: "reports",
          ...extra,
        }),
      );
      expect(response.status).toBe(422);
    }
  });
});
