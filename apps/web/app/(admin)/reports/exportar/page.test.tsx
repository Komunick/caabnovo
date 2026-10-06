import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import ReportExportPage from "./page";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  notFound: () => {
    throw new Error("not-found");
  },
}));
vi.mock("@/modules/auth/request-actor", () => ({ resolveRequestActor: vi.fn() }));
vi.mock("@caab/config", () => ({
  loadServerEnv: () => ({ BETTER_AUTH_SECRET: "synthetic-secret" }),
}));
vi.mock("@/modules/exports/http", () => ({ exportCsrf: () => "synthetic-csrf" }));
vi.mock("@/modules/reports/ui/report-export-screen", () => ({ ReportExportScreen: () => null }));

beforeEach(() => {
  vi.mocked(resolveRequestActor).mockResolvedValue({
    userId: "00000000-0000-4000-8000-000000000001",
    sessionId: "synthetic-session",
    permissions: new Set(["reports:read", "exports:generate"]),
  });
});
it("explains revoked source access without exposing the export form or using a 404", async () => {
  const page = await ReportExportPage({
    searchParams: Promise.resolve({ dataset: "members", format: "csv" }),
  });
  const markup = renderToStaticMarkup(page);
  expect(markup).toContain('role="alert"');
  expect(markup).toContain("Seu acesso mudou.");
  expect(markup).toContain('href="/reports"');
  expect(markup).not.toContain("export-form");
});
it.each(["xlsx", "csv", "pdf", "html"])(
  "validates the requested format %s before prefilling",
  async (format) => {
    const page = await ReportExportPage({
      searchParams: Promise.resolve({ dataset: "executive", format }),
    });
    expect(page.props.initial.format).toBe(format === "html" ? undefined : format);
  },
);
it("keeps unknown datasets as 404", async () => {
  await expect(
    ReportExportPage({ searchParams: Promise.resolve({ dataset: "unknown" }) }),
  ).rejects.toThrow("not-found");
});
it("redirects unauthenticated visitors to login", async () => {
  vi.mocked(resolveRequestActor).mockResolvedValue(null);
  await expect(
    ReportExportPage({ searchParams: Promise.resolve({ dataset: "executive" }) }),
  ).rejects.toThrow("redirect:/login");
});
