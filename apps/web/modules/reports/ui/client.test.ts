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
describe("export comment handoff through sessionStorage", () => {
  const text = "漢".repeat(2000);
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => vi.useRealTimers());
  it("stores the full comment and takes it once, removing the key", () => {
    stashReportExportNotes(text);
    expect(JSON.parse(window.sessionStorage.getItem(REPORT_EXPORT_NOTES_KEY)!).text).toHaveLength(
      2000,
    );
    expect(takeReportExportNotes()).toBe(text);
    expect(window.sessionStorage.getItem(REPORT_EXPORT_NOTES_KEY)).toBeNull();
    expect(takeReportExportNotes()).toBe("");
  });
  it("clears a stale value when the new comment is empty", () => {
    stashReportExportNotes("antigo");
    stashReportExportNotes("   ");
    expect(window.sessionStorage.getItem(REPORT_EXPORT_NOTES_KEY)).toBeNull();
    stashReportExportNotes(undefined);
    expect(takeReportExportNotes()).toBe("");
  });
  it("treats the stored value as untrusted input", () => {
    const store = (value: string) => window.sessionStorage.setItem(REPORT_EXPORT_NOTES_KEY, value);
    store("not json");
    expect(takeReportExportNotes()).toBe("");
    store(JSON.stringify({ text: 42, at: Date.now() }));
    expect(takeReportExportNotes()).toBe("");
    store(JSON.stringify(["x"]));
    expect(takeReportExportNotes()).toBe("");
    store(JSON.stringify({ text: `  ${"a".repeat(2500)}  `, at: Date.now() }));
    expect(takeReportExportNotes()).toBe("a".repeat(2000));
    // Every attempt consumed the key, valid or not.
    expect(window.sessionStorage.getItem(REPORT_EXPORT_NOTES_KEY)).toBeNull();
  });
  it("ignores a value left behind by a navigation that never completed", () => {
    vi.useFakeTimers();
    stashReportExportNotes("pendente");
    vi.advanceTimersByTime(6 * 60 * 1000);
    expect(takeReportExportNotes()).toBe("");
  });
  it("never throws when sessionStorage is unavailable", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    vi.spyOn(window, "sessionStorage", "get").mockReturnValue(broken as unknown as Storage);
    expect(() => stashReportExportNotes(text)).not.toThrow();
    expect(takeReportExportNotes()).toBe("");
    vi.restoreAllMocks();
  });
});
