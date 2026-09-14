import { afterEach, describe, expect, it, vi } from "vitest";
import { signContentGrant, verifyContentGrant } from "./content-grant";
import { readLimitedBody, createContentRoute } from "./http/content-route";

const secret = "synthetic-content-secret-with-at-least-32-characters";
const key = "database/private/11111111-1111-4111-8111-111111111111";
afterEach(() => vi.useRealTimers());
describe("database file capabilities", () => {
  it("binds the signature to the key, method, secret and expiry", () => {
    vi.useFakeTimers();
    const grant = signContentGrant(secret, "https://panel.example.test", key, "GET");
    const token = new URL(grant.url).searchParams.get("grant")!;
    expect(verifyContentGrant(secret, token, "GET")).toBe(key);
    expect(() => verifyContentGrant(secret, token, "PUT")).toThrow();
    expect(() => verifyContentGrant("other-secret", token, "GET")).toThrow();
    expect(() => verifyContentGrant(secret, `X${token.slice(1)}`, "GET")).toThrow();
    vi.advanceTimersByTime(300_000);
    expect(() => verifyContentGrant(secret, token, "GET")).toThrow();
  });
  it("cannot grant a quarantine download or a private overwrite", () => {
    for (const [object, method] of [
      [key, "PUT"],
      [key.replace("private", "quarantine"), "GET"],
    ] as const) {
      const url = signContentGrant(secret, "https://panel.example.test", object, method).url;
      expect(() =>
        verifyContentGrant(secret, new URL(url).searchParams.get("grant"), method),
      ).toThrow();
    }
  });
  it("rejects missing capabilities before accessing the database", async () => {
    const pool = vi.fn();
    const route = createContentRoute({ pool, secret: () => secret });
    const response = await route(new Request("https://panel.example.test/api/v1/files/content"));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(pool).not.toHaveBeenCalled();
  });
  it("bounds chunked bodies even without Content-Length", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(3));
        controller.enqueue(new Uint8Array(3));
      },
      cancel,
    });
    const request = new Request("http://localhost/upload", {
      method: "PUT",
      body: stream,
      duplex: "half",
    } as RequestInit);
    await expect(readLimitedBody(request, 5)).rejects.toMatchObject({ status: 413 });
    expect(cancel).toHaveBeenCalled();
  });
});
