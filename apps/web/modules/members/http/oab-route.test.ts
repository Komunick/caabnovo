import { describe, it, expect, vi } from "vitest";
import { createOabRoute } from "./oab-route";
import { OabError } from "../oab-errors";

const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(["members:read"]),
};
const headers = {
  origin: "http://localhost",
  "content-type": "application/json",
  "x-csrf-token": crypto.randomUUID(),
};
const request = (body: unknown = { number: "1234", state: "BA" }, extra = {}) =>
  new Request("http://localhost/api/v1/members/oab-query", {
    method: "POST",
    headers: { ...headers, ...extra },
    body: JSON.stringify(body),
  });
describe("OAB private route", () => {
  it("rejects anonymous access and absent member permission before lookup", async () => {
    const query = vi.fn();
    for (const [identity, status] of [
      [null, 401],
      [{ ...actor, permissions: new Set<string>() }, 403],
    ] as const) {
      const route = createOabRoute({ resolveActor: async () => identity, query });
      const response = await route(request());
      expect(response.status).toBe(status);
      expect(response.headers.get("cache-control")).toContain("no-store");
    }
    expect(query).not.toHaveBeenCalled();
  });
  it("accepts authorized read permission with origin and CSRF", async () => {
    const query = vi.fn().mockResolvedValue({ status: "not_found" });
    const route = createOabRoute({ resolveActor: async () => actor, query });
    expect((await route(request())).status).toBe(200);
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ actor }), {
      number: "1234",
      state: "BA",
    });
    expect((await route(request({ memberId: actor.userId }))).status).toBe(200);
    expect(query).toHaveBeenLastCalledWith(expect.anything(), { memberId: actor.userId });
  });
  it.each([{ origin: "https://foreign.test" }, { "x-csrf-token": "" }])(
    "rejects untrusted request %j",
    async (extra) => {
      const query = vi.fn();
      const route = createOabRoute({ resolveActor: async () => actor, query });
      expect((await route(request(undefined, extra))).status).toBe(403);
      expect(query).not.toHaveBeenCalled();
    },
  );
  it.each([
    { number: "1234", state: "RJ" },
    { number: "1234", state: "BA", memberId: actor.userId },
    { number: "1A", state: "BA" },
    { memberId: "bad" },
    { number: "1234", state: "BA", cpf: "private" },
  ])("rejects unsupported/ambiguous input %j", async (input) => {
    const query = vi.fn();
    const route = createOabRoute({ resolveActor: async () => actor, query });
    expect((await route(request(input))).status).toBe(422);
    expect(query).not.toHaveBeenCalled();
  });
  it("rejects excessive bodies and unsupported method", async () => {
    const query = vi.fn();
    const route = createOabRoute({ resolveActor: async () => actor, query });
    expect((await route(request({ number: "1".repeat(65537) }))).status).toBe(413);
    expect((await route(new Request("http://localhost/api/v1/members/oab-query"))).status).toBe(
      405,
    );
    expect(query).not.toHaveBeenCalled();
  });
  it.each([
    ["OAB_NOT_CONFIGURED", 503],
    ["OAB_INVALID_RESPONSE", 502],
    ["OAB_TIMEOUT", 504],
    ["OAB_RATE_LIMITED", 429],
    ["OAB_MEMBER_CHANGED", 409],
  ] as const)("preserves safe error %s", async (code, status) => {
    const route = createOabRoute({
      resolveActor: async () => actor,
      query: async () => {
        throw new OabError(code, status);
      },
    });
    const response = await route(request());
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
    expect(response.headers.get("cache-control")).toContain("no-store");
    if (status === 429) expect(response.headers.get("retry-after")).toBe("60");
  });
});
