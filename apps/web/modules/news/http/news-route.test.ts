import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyNewsBody, newsDraftMetadataSchema } from "@caab/contracts";
import { createNewsRoutes } from "./news-route";
import type { RequestActor } from "../../shared/request-context";
import { NewsPolicyError } from "../errors";

const actor: RequestActor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(),
  mfaVerified: false,
};
const newsId = crypto.randomUUID();
const record = {
  id: newsId,
  metadata: newsDraftMetadataSchema.parse({}),
  body: emptyNewsBody,
  revision: 1,
  archived: false,
  editorUserId: actor.userId,
  updatedAt: new Date().toISOString(),
};
function setup(signedIn = true) {
  const service = {
    publication: vi.fn().mockResolvedValue({ publication: null, actions: [] }),
    publish: vi.fn().mockResolvedValue(record),
    unpublish: vi.fn().mockResolvedValue(record),
    schedule: vi.fn().mockResolvedValue({}),
    cancel: vi.fn().mockResolvedValue({}),
    retry: vi.fn().mockResolvedValue({}),
    media: vi.fn().mockResolvedValue({ items: [], page: 1, hasNextPage: false }),
    mediaDownload: vi.fn().mockResolvedValue({
      url: "https://storage.test/signed",
      expiresAt: new Date().toISOString(),
    }),
    create: vi.fn().mockResolvedValue(record),
    get: vi.fn().mockResolvedValue(record),
    list: vi.fn().mockResolvedValue({ items: [record], page: 1, totalPages: 1 }),
    update: vi.fn().mockResolvedValue(record),
    duplicate: vi.fn().mockResolvedValue(record),
    archive: vi.fn().mockResolvedValue(record),
    restore: vi.fn().mockResolvedValue(record),
    versions: vi.fn().mockResolvedValue({ items: [], page: 1, totalPages: 1 }),
  };
  return {
    service,
    routes: createNewsRoutes({ resolveActor: async () => (signedIn ? actor : null), service }),
  };
}
function mutation(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/v1/news", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "x-csrf-token": "s".repeat(32),
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID(),
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.unstubAllEnvs());

describe("news HTTP boundary", () => {
  it("creates and updates drafts from the configured public origin behind a proxy", async () => {
    const { routes, service } = setup();
    vi.stubEnv("BETTER_AUTH_URL", "https://panel.example.test");
    const create = await routes.POST(
      mutation({ metadata: {} }, { origin: "https://panel.example.test" }),
    );
    expect(create.status).toBe(201);
    expect(service.create).toHaveBeenCalledOnce();

    const update = await routes.PUT(
      mutation(
        { expectedVersion: 1, metadata: {}, body: emptyNewsBody },
        { origin: "https://panel.example.test" },
      ),
      newsId,
    );
    expect(update.status).toBe(200);
    expect(service.update).toHaveBeenCalledOnce();
  });

  it("returns safe field paths for publication validation and duplicate addresses", async () => {
    const { routes, service } = setup();
    service.publish.mockRejectedValue(
      new NewsPolicyError("NEWS_NOT_READY", 422, "Internal details", [
        { field: "title", code: "TITLE_REQUIRED" },
        { field: "cover.alt", code: "COVER_ALT_REQUIRED" },
      ]),
    );
    const response = await routes.publish(
      mutation({ expectedVersion: 1, channels: ["app"] }),
      newsId,
      "publish",
    );
    expect(response.status).toBe(422);
    const data = await response.json();
    expect(data.fields).toEqual([
      { path: "title", code: "TITLE_REQUIRED" },
      { path: "cover.alt", code: "COVER_ALT_REQUIRED" },
    ]);
    expect(JSON.stringify(data)).not.toContain("Internal details");
    service.publish.mockRejectedValue(new NewsPolicyError("NEWS_SLUG_CONFLICT", 409, "Duplicate"));
    expect(
      (
        await (
          await routes.publish(
            mutation({ expectedVersion: 1, channels: ["app"] }),
            newsId,
            "publish",
          )
        ).json()
      ).fields,
    ).toEqual([{ path: "metadata.slug", code: "NEWS_SLUG_CONFLICT" }]);
  });
  it("protects publication and schedule commands with CSRF and idempotency", async () => {
    const { routes, service } = setup();
    for (const action of ["publish", "unpublish", "schedule"] as const) {
      const body = {
        expectedVersion: 1,
        channels: ["app"],
        ...(action === "schedule"
          ? { action: "publish", runAt: new Date(Date.now() + 60000).toISOString() }
          : {}),
      };
      expect(
        (await routes.publish(mutation(body, { origin: "https://foreign.test" }), newsId, action))
          .status,
      ).toBe(403);
      expect(
        (await routes.publish(mutation(body, { "idempotency-key": "" }), newsId, action)).status,
      ).toBe(422);
      expect(service[action]).not.toHaveBeenCalled();
      expect((await routes.publish(mutation(body), newsId, action)).status).toBe(200);
    }
    for (const action of ["cancel", "retry"] as const) {
      expect(
        (
          await routes.cancel(
            mutation({}, { "x-csrf-token": "" }),
            newsId,
            crypto.randomUUID(),
            action,
          )
        ).status,
      ).toBe(403);
      expect(service[action]).not.toHaveBeenCalled();
    }
  });
  it("keeps temporary media redirects private and returns no file metadata", async () => {
    const { routes, service } = setup();
    const fileId = crypto.randomUUID();
    const response = await routes.mediaDownload(
      new Request(`http://localhost:3000/api/v1/news/${newsId}/media/${fileId}`),
      newsId,
      fileId,
    );
    expect(service.mediaDownload).toHaveBeenCalledWith(actor, newsId, fileId);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://storage.test/signed");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(await response.text()).toBe("");
  });

  it("denies every operation without a session before invoking services", async () => {
    const { routes, service } = setup(false);
    const responses = await Promise.all([
      routes.GET(new Request("http://localhost:3000/api/v1/news")),
      routes.media(new Request("http://localhost:3000/api/v1/news"), newsId),
      routes.mediaDownload(
        new Request("http://localhost:3000/api/v1/news"),
        newsId,
        crypto.randomUUID(),
      ),
      routes.POST(mutation({ metadata: {} })),
      routes.publication(mutation({}), newsId),
      ...(["publish", "unpublish", "schedule"] as const).map((action) =>
        routes.publish(mutation({}), newsId, action),
      ),
      routes.cancel(mutation({}), newsId, crypto.randomUUID()),
      routes.cancel(mutation({}), newsId, crypto.randomUUID(), "retry"),
      routes.get(new Request("http://localhost:3000/api/v1/news"), newsId),
      routes.PUT(mutation({}), newsId),
      routes.versions(new Request("http://localhost:3000/api/v1/news"), newsId),
      ...(["duplicate", "archive", "restore"] as const).map((action) =>
        routes.command(mutation({}), newsId, action),
      ),
    ]);
    expect(responses.map((r) => r.status)).toEqual(Array(16).fill(401));
    for (const fn of Object.values(service)) expect(fn).not.toHaveBeenCalled();
    for (const response of responses)
      expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("accepts panel access without news permissions and derives authorship from the session", async () => {
    const { routes, service } = setup();
    expect((await routes.POST(mutation({ metadata: {} }))).status).toBe(201);
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ actor }),
      expect.objectContaining({ metadata: record.metadata }),
    );
    expect(
      (await routes.POST(mutation({ metadata: {}, authorId: crypto.randomUUID() }))).status,
    ).toBe(422);
    expect(service.create).toHaveBeenCalledTimes(1);
  });

  it("rejects cross-origin, missing CSRF and missing idempotency before writes", async () => {
    const { routes, service } = setup();
    expect(
      (await routes.POST(mutation({ metadata: {} }, { origin: "https://outside.test" }))).status,
    ).toBe(403);
    expect((await routes.POST(mutation({ metadata: {} }, { "x-csrf-token": "" }))).status).toBe(
      403,
    );
    expect((await routes.POST(mutation({ metadata: {} }, { "idempotency-key": "" }))).status).toBe(
      422,
    );
    expect(
      (
        await routes.command(
          mutation({ expectedVersion: 1 }, { "idempotency-key": "" }),
          newsId,
          "duplicate",
        )
      ).status,
    ).toBe(422);
    expect(service.create).not.toHaveBeenCalled();
    expect(service.duplicate).not.toHaveBeenCalled();
  });

  it("bounds streamed JSON even without content-length and reports malformed input", async () => {
    const { routes, service } = setup();
    const tooLarge = await routes.POST(mutation({ metadata: { title: "x".repeat(1_048_577) } }));
    expect(tooLarge.status).toBe(413);
    const invalid = mutation({});
    const malformed = new Request(invalid.url, {
      method: "POST",
      headers: invalid.headers,
      body: "{",
    });
    expect((await routes.POST(malformed)).status).toBe(422);
    expect(service.create).not.toHaveBeenCalled();
  });

  it("validates ids and pagination and keeps drafts private", async () => {
    const { routes, service } = setup();
    expect(
      (await routes.get(new Request("http://localhost:3000/api/v1/news"), "invalid")).status,
    ).toBe(422);
    expect((await routes.GET(new Request("http://localhost:3000/api/v1/news?page=0"))).status).toBe(
      422,
    );
    const response = await routes.GET(
      new Request("http://localhost:3000/api/v1/news?state=archived&search=teste"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(service.list).toHaveBeenCalledWith(actor, {
      state: "archived",
      search: "teste",
      page: 1,
      category: "",
      channel: "all",
      collection: "all",
      cover: "all",
      highlight: "all",
      sort: "updated-desc",
      updatedWithin: "all",
    });
  });

  it("returns version conflicts without exposing internal errors", async () => {
    const { routes, service } = setup();
    service.update.mockRejectedValueOnce(
      Object.assign(new Error("sensitive sql"), { status: 409, code: "NEWS_VERSION_CONFLICT" }),
    );
    const response = await routes.PUT(
      mutation({ expectedVersion: 1, metadata: {}, body: emptyNewsBody }),
      newsId,
    );
    expect(response.status).toBe(409);
    expect(await response.text()).not.toContain("sensitive sql");
    service.get.mockRejectedValueOnce(new Error("database secret"));
    expect(
      await (await routes.get(new Request("http://localhost:3000/api/v1/news"), newsId)).text(),
    ).not.toContain("database secret");
  });
});
