import { describe, it, expect, vi } from "vitest";
import { createPartnerRoute } from "./routes";
const id = crypto.randomUUID();
function setup(
  permissions: string[] | null = ["partners:read", "partners:write", "partners:publish"],
) {
  const service = {
    list: vi.fn().mockResolvedValue({ items: [] }),
    benefits: vi.fn().mockResolvedValue({ items: [] }),
    get: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({}),
    command: vi.fn().mockResolvedValue({}),
    history: vi.fn().mockResolvedValue({ items: [] }),
    files: vi.fn().mockResolvedValue({ items: [] }),
    download: vi.fn().mockResolvedValue({ url: "https://example.test/file" }),
  };
  return {
    service,
    route: createPartnerRoute({
      resolveActor: async () =>
        permissions ? { userId: id, sessionId: id, permissions: new Set(permissions) } : null,
      service,
    }),
  };
}
function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/v1/partners", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
describe("partner private HTTP boundary", () => {
  it.each(
    [[], ["benefits"], [id], [id, "history"], [id, "files"], [id, "files", id]].map((path) => ({
      path,
    })),
  )("rejects anonymous and unauthorized reads $path", async ({ path }) => {
    for (const [permissions, status] of [
      [null, 401],
      [[], 403],
    ] as const) {
      const { route, service } = setup(permissions === null ? null : [...permissions]);
      const response = await route(new Request("http://localhost/api/v1/partners"), path);
      expect(response.status).toBe(status);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(service.get).not.toHaveBeenCalled();
    }
  });
  it("dispatches benefits before parsing a partner id and validates filters", async () => {
    const { route, service } = setup();
    expect(
      (
        await route(new Request("http://localhost/api/v1/partners/benefits?channel=site"), [
          "benefits",
        ])
      ).status,
    ).toBe(200);
    expect(service.benefits).toHaveBeenCalledWith(expect.anything(), { channel: "site" });
    expect((await route(new Request("http://localhost/api/v1/partners?page=0"))).status).toBe(422);
  });
  it.each(["publish", "hide"])("requires publication permission for %s", async (action) => {
    for (const [permissions, status] of [
      [["partners:read", "partners:write"], 403],
      [["partners:read", "partners:publish"], 200],
    ] as const) {
      const { route, service } = setup([...permissions]);
      expect(
        (
          await route(
            post({ action, benefitId: id, expectedVersion: 1, justification: "Decisão sintética" }),
            [id, "commands"],
          )
        ).status,
      ).toBe(status);
      expect(service.command).toHaveBeenCalledTimes(status === 200 ? 1 : 0);
    }
  });
  it("requires write permission, trusted origin, CSRF and idempotency before creating", async () => {
    const body = {
      profile: { name: "Sintético", category: "Teste" },
      justification: "Cadastro sintético",
    };
    const reader = setup(["partners:read"]);
    expect((await reader.route(post(body))).status).toBe(403);
    expect(reader.service.create).not.toHaveBeenCalled();
    for (const [headers, status] of [
      [{ origin: "https://foreign.example.test" }, 403],
      [{ "x-csrf-token": "" }, 403],
      [{ "idempotency-key": "" }, 422],
    ] as [Record<string, string>, number][]) {
      const { route, service } = setup();
      expect((await route(post(body, headers))).status).toBe(status);
      expect(service.create).not.toHaveBeenCalled();
    }
    expect((await setup().route(post(body))).status).toBe(201);
  });
  it("limits JSON bytes and returns safe errors for malformed data and unknown routes", async () => {
    const { route, service } = setup();
    expect((await route(post({ data: "x".repeat(65537) }))).status).toBe(413);
    expect(service.create).not.toHaveBeenCalled();
    expect(
      (
        await route(
          new Request("http://localhost/api/v1/partners", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: "http://localhost",
              "x-csrf-token": crypto.randomUUID(),
              "idempotency-key": crypto.randomUUID(),
            },
            body: "{",
          }),
        )
      ).status,
    ).toBe(422);
    expect((await route(post({}), ["benefits"])).status).toBe(404);
    expect(
      (await route(new Request("http://localhost/api/v1/partners", { method: "DELETE" }))).status,
    ).toBe(405);
  });
});
