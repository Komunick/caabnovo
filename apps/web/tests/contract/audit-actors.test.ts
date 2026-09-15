import { describe, expect, it, vi } from "vitest";
import { createAuditActorsRoute } from "../../modules/audit/http/audit-actors-route";

describe("audit actor search authorization", () => {
  it.each([null, [], ["audit:read"], ["users:read"]])(
    "denies search without both permissions: %j",
    async (permissions) => {
      const search = vi.fn();
      const route = createAuditActorsRoute({
        resolveActor: async () =>
          permissions === null
            ? null
            : {
                userId: crypto.randomUUID(),
                sessionId: crypto.randomUUID(),
                permissions: new Set(permissions),
              },
        search,
      });
      const response = await route(
        new Request("https://caab.example.test/api/v1/audit-actors?q=canary"),
      );
      expect(response.status).toBe(permissions === null ? 401 : 403);
      expect(search).not.toHaveBeenCalled();
    },
  );
  it("bounds and validates searches and returns only uncached name/ID pairs", async () => {
    const id = crypto.randomUUID();
    const search = vi.fn(async () => ({
      items: [{ id, name: "Pessoa sintética", email: "private-canary" }],
      nextCursor: null,
    }));
    const route = createAuditActorsRoute({
      resolveActor: async () => ({
        userId: id,
        sessionId: crypto.randomUUID(),
        permissions: new Set(["audit:read", "users:read"]),
      }),
      search,
    });
    const response = await route(
      new Request("https://caab.example.test/api/v1/audit-actors?q=%20Pessoa%20&limit=2"),
    );
    expect(search).toHaveBeenCalledWith({ q: "Pessoa", limit: 2 });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      items: [{ id, name: "Pessoa sintética" }],
      nextCursor: null,
    });
    for (const query of ["limit=51", "cursor=invalid", `q=${"a".repeat(161)}`]) {
      search.mockClear();
      expect(
        (await route(new Request(`https://caab.example.test/api/v1/audit-actors?${query}`))).status,
      ).toBe(422);
      expect(search).not.toHaveBeenCalled();
    }
  });
});
