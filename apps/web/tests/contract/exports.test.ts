import { expect, it, vi } from "vitest";
import { createExportRoutes, exportCsrf } from "../../modules/exports/http";
import { usersExport } from "../../modules/users/export-adapter";
const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(["users:read", "exports:generate"]),
};
const secret = "synthetic-export-secret-at-least-32-chars",
  origin = "https://panel.example.test",
  rid = crypto.randomUUID();
const config = { module: "users", dataset: "accounts", format: "csv", columns: ["name"] };
function fixture() {
  const failed = vi.fn(async () => {}),
    prepare = vi.fn(async () => {
      throw new Error("not used");
    });
  return {
    failed,
    prepare,
    routes: createExportRoutes({
      actor: async () => actor,
      secret: () => secret,
      origin: () => origin,
      lookup: () => usersExport,
      prepare,
      failed,
      status: async () => null,
    }),
  };
}
function post(overrides: Record<string, string> = {}, source = origin) {
  return new Request(`${origin}/api/v1/exports/download`, {
    method: "POST",
    headers: { origin: source, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      requestId: rid,
      csrfToken: exportCsrf(actor, secret),
      config: JSON.stringify(config),
      ...overrides,
    }),
  });
}
it("rejects wrong Origin and CSRF before creating any operation", async () => {
  const f = fixture();
  for (const request of [post({}, "https://other.test"), post({ csrfToken: "invalid" })])
    expect((await f.routes.download(request)).status).toBe(403);
  expect(f.prepare).not.toHaveBeenCalled();
  expect(f.failed).not.toHaveBeenCalled();
});
it("ties form CSRF to the session and returns a safe same-origin frame error", async () => {
  const f = fixture();
  const response = await f.routes.download(
    post({ csrfToken: exportCsrf({ ...actor, sessionId: crypto.randomUUID() }, secret) }),
  );
  expect(response.status).toBe(403);
  expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
  const html = await response.text();
  expect(html).toContain(rid);
  expect(html).not.toContain(secret);
  expect(html).not.toContain(actor.sessionId);
});
it("records authorized invalid configuration and never silently drops forbidden columns", async () => {
  const f = fixture();
  const response = await f.routes.download(
    post({ config: JSON.stringify({ ...config, columns: ["name", "password"] }) }),
  );
  expect(response.status).toBe(422);
  expect(f.prepare).not.toHaveBeenCalled();
  expect(f.failed).toHaveBeenCalledOnce();
});
it("catalog exposes only permitted columns and status hides another owner's operation", async () => {
  const f = fixture();
  const response = await f.routes.catalog(
    new Request(`${origin}/api/v1/exports/catalog?module=users&dataset=accounts`),
  );
  const body = await response.json();
  expect(body.formats).toEqual(["xlsx", "csv", "pdf"]);
  expect(body.columns.map((c: { key: string }) => c.key)).not.toContain("roles");
  expect((await f.routes.status(new Request(origin), rid)).status).toBe(404);
});
