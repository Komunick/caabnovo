import { afterEach, expect, it, vi } from "vitest";
import { apiError, reportQuerySchema } from "@caab/contracts";
import { reportExportHref, reportRequest } from "./client";
afterEach(() => vi.unstubAllGlobals());
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
    columns: "unit,name,date",
    sort: "unit",
    direction: "asc",
  });
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
