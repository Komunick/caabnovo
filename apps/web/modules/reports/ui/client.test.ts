import { afterEach, expect, it, vi } from "vitest";
import { apiError, reportQuerySchema } from "@caab/contracts";
import { reportExportHref, reportRequest } from "./client";
afterEach(() => vi.unstubAllGlobals());
it("preserves grouped order and overview filters and comments in direct export links", () => {
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
        "Análise sintética",
      ),
      "http://caab.test",
    );
    expect(href.searchParams.get("dataset")).toBe(view);
    expect(href.searchParams.get("environment")).toBe("test");
    expect(href.searchParams.get("channel")).toBe("site");
    expect(href.searchParams.get("source")).toBe("caab.site");
    expect(href.searchParams.get("notes")).toBe("Análise sintética");
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
