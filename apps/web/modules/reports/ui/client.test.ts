// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, reportQuerySchema } from "@caab/contracts";
import {
  REPORT_EXPORT_NOTES_KEY,
  reportExportHref,
  reportRequest,
  stashReportExportNotes,
  takeReportExportNotes,
} from "./client";
afterEach(() => vi.unstubAllGlobals());
it("preserves only supported formats when requesting a failed export again", () => {
  const query = reportQuerySchema.parse({ from: "2026-09-01", to: "2026-09-30" });
  for (const format of ["xlsx", "csv", "pdf", "html"]) {
    const href = new URL(reportExportHref(query, undefined, format), "http://caab.test");
    expect(href.searchParams.get("format")).toBe(format === "html" ? null : format);
  }
});
it("preserves grouped order and overview filters in direct export links, without the comment", () => {
  const query = reportQuerySchema.parse({
    view: "details",
    from: "2026-01-01",
    to: "2026-09-30",
    groupBy: "city",
    sort: "city",
    direction: "asc",
  });
  const grouped = new URL(
    reportExportHref(query, { group: "Cidade", count: "Quantidade" }),
    "http://caab.test",
  );
  expect(grouped.searchParams.get("dataset")).toBe("membersGrouped");
  expect(grouped.searchParams.get("groupBy")).toBe("city");
  expect(grouped.searchParams.get("sort")).toBe("group");
  for (const view of ["summary", "executive"] as const) {
    const href = new URL(
      reportExportHref(
        { ...query, view, environment: "test", channel: "site", source: "caab.site" },
        {},
      ),
      "http://caab.test",
    );
    expect(href.searchParams.get("dataset")).toBe(view);
    expect(href.searchParams.get("environment")).toBe("test");
    expect(href.searchParams.get("channel")).toBe("site");
    expect(href.searchParams.get("source")).toBe("caab.site");
    expect(href.searchParams.has("notes")).toBe(false);
    expect(href.searchParams.has("columns")).toBe(false);
  }
});
it("links the detailed analysis to its direct export with filters, columns and order", () => {
  const href = new URL(
    reportExportHref(
      reportQuerySchema.parse({
        view: "details",
        dataset: "bookings",
        from: "2026-01-01",
        to: "2026-09-30",
        search: "consulta",
        status: "",
        columns: ["unit", "name", "date"],
        sort: "unit",
        direction: "asc",
        page: 7,
      }),
      { name: "Procedimento", unit: "Unidade", date: "Data" },
    ),
    "http://caab.test",
  );
  expect(href.pathname).toBe("/reports/exportar");
  expect(Object.fromEntries(href.searchParams)).toEqual({
    dataset: "bookings",
    dateScope: "period",
    from: "2026-01-01",
    to: "2026-09-30",
    search: "consulta",
    columns: "name,unit,date",
    sort: "unit",
    direction: "asc",
  });
});
it("uses displayed columns after unchecking and rechecking Name, including the all-columns default", () => {
  const displayed = { name: "Nome", city: "Cidade", date: "Cadastro" };
  for (const columns of [["city", "date", "name"], []]) {
    const query = reportQuerySchema.parse({
      view: "details",
      dataset: "members",
      from: "2026-09-01",
      to: "2026-09-30",
      columns,
    });
    const href = new URL(reportExportHref(query, displayed), "http://caab.test");
    expect(href.searchParams.get("columns")).toBe("name,city,date");
  }
});
it("carries the access filters only for the access dataset", () => {
  const href = new URL(
    reportExportHref(
      reportQuerySchema.parse({
        view: "details",
        dataset: "access",
        from: "2026-09-01",
        to: "2026-09-30",
        channel: "site",
        environment: "development",
        source: "caab.site",
      }),
      { name: "Tela", views: "Visualizações" },
    ),
    "http://caab.test",
  );
  expect(href.searchParams.get("channel")).toBe("site");
  expect(href.searchParams.get("environment")).toBe("development");
  expect(href.searchParams.get("source")).toBe("caab.site");
  expect(href.searchParams.has("page")).toBe(false);
});
it("reads the shared API error contract and explains a saved-query conflict", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        Response.json(
          apiError(
            "REPORT_QUERY_CONFLICT",
            "Request conflicts with current state",
            crypto.randomUUID(),
          ),
          { status: 409 },
        ),
      ),
  );
  await expect(reportRequest("/queries")).rejects.toThrow(
    "Esta consulta mudou. Suas edições foram preservadas.",
  );
});
it("does not expose raw server messages on unexpected failures", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json(apiError("INTERNAL_ERROR", "private SQL details", crypto.randomUUID()), {
        status: 500,
      }),
    ),
  );
  await expect(reportRequest("/queries")).rejects.toThrow("Não foi possível concluir.");
});
it("keeps the management comment out of the link, so 2000 multibyte characters cannot exceed the URL limit", () => {
  const query = reportQuerySchema.parse({
    view: "executive",
    from: "2026-01-01",
    to: "2026-09-30",
  });
  const href = reportExportHref(query, {});
  expect(href).not.toContain("notes");
  expect(href).not.toContain(encodeURIComponent("漢"));
  expect(href.length).toBeLessThan(300);
  // The old shape would have been ~18 KB: 2000 x "%E6%BC%A2".
  expect(new URLSearchParams({ notes: "漢".repeat(2000) }).toString().length).toBeGreaterThan(
    16000,
  );
});
describe("export comment handoff in authenticated drafts", () => {
  const text = "漢".repeat(2000);
  const href = "/reports/exportar?dataset=executive&format=csv";
  const values = new Map<string, unknown>();
  const cache = {
    writeForRoute: (_path: string, key: string, value: unknown) => {
      values.set(key, value);
    },
    read: (key: string) => values.get(key),
    remove: (key: string) => {
      values.delete(key);
    },
  };
  beforeEach(() => {
    values.clear();
    window.sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  it("keeps the full comment in memory and consumes it once", () => {
    stashReportExportNotes(cache, text, href);
    expect(window.sessionStorage.length).toBe(0);
    expect(takeReportExportNotes(cache, href)).toBe(text);
    expect(values.has(REPORT_EXPORT_NOTES_KEY)).toBe(false);
    expect(takeReportExportNotes(cache, href)).toBe("");
  });
  it("replaces a pending comment with an empty one", () => {
    stashReportExportNotes(cache, "antigo", href);
    stashReportExportNotes(cache, "   ", href);
    expect(takeReportExportNotes(cache, href)).toBe("");
    stashReportExportNotes(cache, undefined, href);
    expect(takeReportExportNotes(cache, href)).toBe("");
  });
  it("validates malformed values and truncates untrusted comments", () => {
    for (const stored of ["not json", { text: 42 }, { text: "x", at: NaN }, ["x"]]) {
      values.set(REPORT_EXPORT_NOTES_KEY, stored);
      expect(takeReportExportNotes(cache, href)).toBe("");
      expect(values.has(REPORT_EXPORT_NOTES_KEY)).toBe(false);
    }
    stashReportExportNotes(cache, `  ${"a".repeat(2500)}  `, href);
    expect(takeReportExportNotes(cache, href)).toBe("a".repeat(2000));
  });
  it("discards handoffs for another selection and accepts equivalent query order", () => {
    stashReportExportNotes(cache, text, href);
    expect(takeReportExportNotes(cache, "/reports/exportar?dataset=summary")).toBe("");
    expect(takeReportExportNotes(cache, href)).toBe("");
    stashReportExportNotes(cache, text, href);
    expect(takeReportExportNotes(cache, "/reports/exportar?format=csv&dataset=executive")).toBe(
      text,
    );
  });
  it("expires a comment left behind by a navigation that never completed", () => {
    vi.useFakeTimers();
    stashReportExportNotes(cache, "pendente", href);
    vi.advanceTimersByTime(6 * 60 * 1000);
    expect(takeReportExportNotes(cache, href)).toBe("");
  });
  it("discards legacy storage without displaying it", () => {
    window.sessionStorage.setItem(
      "caab:reports-export-notes",
      JSON.stringify({ text: "Conta A", at: Date.now() }),
    );
    expect(takeReportExportNotes(cache, href)).toBe("");
    expect(window.sessionStorage.getItem("caab:reports-export-notes")).toBeNull();
  });
  it("continues to transport comments when sessionStorage is unavailable", () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => stashReportExportNotes(cache, text, href)).not.toThrow();
    expect(takeReportExportNotes(cache, href)).toBe(text);
  });
});
