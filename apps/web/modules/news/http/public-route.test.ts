import { describe, it, expect, vi } from "vitest";
import { createPublicNewsRoutes } from "./public-route";
describe("public news HTTP policy", () => {
  it("allows anonymous consumers and returns uncached data with public CORS", async () => {
    const service = {
      list: vi.fn().mockResolvedValue({ items: [], page: 1, hasNextPage: false }),
      get: vi.fn().mockResolvedValue({ schemaVersion: 1 }),
      media: vi
        .fn()
        .mockResolvedValue({ url: "https://storage.test/image", expiresAt: new Date() }),
    };
    const routes = createPublicNewsRoutes(service),
      request = new Request("https://panel.test/api/v1/content/app/news?search=CAAB");
    const response = await routes.list(request, "app");
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(service.list).toHaveBeenCalledWith("app", { search: "CAAB" });
    const image = await routes.media(request, "app", crypto.randomUUID(), crypto.randomUUID());
    expect(image.status).toBe(307);
    expect(await image.text()).toBe("");
  });
  it("returns safe public errors without storage keys or internal details", async () => {
    const routes = createPublicNewsRoutes({
      list: vi.fn(),
      get: vi.fn().mockRejectedValue(
        Object.assign(new Error("private SQL object-key"), {
          status: 404,
          code: "NEWS_NOT_FOUND",
        }),
      ),
      media: vi.fn(),
    });
    const response = await routes.get(
      new Request("https://panel.test/api/v1/content/site/news"),
      "site",
      crypto.randomUUID(),
    );
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain("private SQL");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });
});
