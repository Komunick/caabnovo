import { describe, expect, it, vi } from "vitest";
import { createMemberRoute } from "./routes";
const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set<string>(["members:read", "members:write", "members:review"]),
  mfaVerified: false,
};
function setup(authenticated = true, permissions = actor.permissions) {
  const service = {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    command: vi.fn(),
    history: vi.fn(),
    files: vi.fn(),
    download: vi.fn(),
  };
  return {
    service,
    route: createMemberRoute({
      resolveActor: async () => (authenticated ? { ...actor, permissions } : null),
      service,
    }),
  };
}
describe("member private HTTP boundary", () => {
  it.each(
    [
      [],
      [actor.userId],
      [actor.userId, "history"],
      [actor.userId, "files"],
      [actor.userId, "files", actor.userId],
    ].map((path) => ({ path })),
  )("rejects anonymous reads %j", async ({ path }) => {
    const { route, service } = setup(false);
    const response = await route(new Request("http://localhost/api/v1/members"), path);
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(service.list).not.toHaveBeenCalled();
  });
  it.each([[], [actor.userId, "commands"]].map((path) => ({ path })))(
    "rejects anonymous writes %j",
    async ({ path }) => {
      const { route } = setup(false);
      expect(
        (await route(new Request("http://localhost/api/v1/members", { method: "POST" }), path))
          .status,
      ).toBe(401);
    },
  );
  it("rejects authenticated users without member access before calling the service", async () => {
    const { route, service } = setup(true, new Set());
    expect((await route(new Request("http://localhost/api/v1/members"))).status).toBe(403);
    expect(service.list).not.toHaveBeenCalled();
  });
  it("read-only access cannot create or submit decisions", async () => {
    const { route, service } = setup(true, new Set(["members:read"]));
    const headers = {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    };
    expect(
      (
        await route(
          new Request("http://localhost/api/v1/members", {
            method: "POST",
            headers,
            body: JSON.stringify({ profile: { name: "Teste" }, justification: "Teste" }),
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await route(
          new Request("http://localhost/api/v1/members", {
            method: "POST",
            headers,
            body: JSON.stringify({ action: "archive", expectedVersion: 1, justification: "Teste" }),
          }),
          [actor.userId, "commands"],
        )
      ).status,
    ).toBe(403);
    expect(service.create).not.toHaveBeenCalled();
    expect(service.command).not.toHaveBeenCalled();
  });
  it("requires origin/CSRF/idempotency with module permission", async () => {
    const { route, service } = setup();
    service.create.mockResolvedValue({ id: actor.userId });
    const body = JSON.stringify({
      profile: { name: "Teste" },
      justification: "Cadastro sintético",
    });
    const headers = {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    };
    expect(
      (
        await route(
          new Request("http://localhost/api/v1/members", { method: "POST", headers, body }),
        )
      ).status,
    ).toBe(201);
    expect(
      (
        await route(
          new Request("http://localhost/api/v1/members", {
            method: "POST",
            headers: { ...headers, origin: "http://evil.test" },
            body,
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await route(
          new Request("http://localhost/api/v1/members", {
            method: "POST",
            headers: { ...headers, "idempotency-key": "" },
            body,
          }),
        )
      ).status,
    ).toBe(422);
  });
  it("rejects oversized and malformed JSON before service invocation", async () => {
    const { route, service } = setup();
    const headers = {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    };
    expect(
      (
        await route(
          new Request("http://localhost/api/v1/members", {
            method: "POST",
            headers,
            body: "x".repeat(65537),
          }),
        )
      ).status,
    ).toBe(413);
    expect(
      (
        await route(
          new Request("http://localhost/api/v1/members", { method: "POST", headers, body: "{" }),
        )
      ).status,
    ).toBe(422);
    expect(service.create).not.toHaveBeenCalled();
  });
});
