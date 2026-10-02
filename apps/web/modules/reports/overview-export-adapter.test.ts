import { describe, expect, it } from "vitest";
import { authorizeExport, authorizedCatalog, exportRegistry } from "../exports/catalog";
import { reportExportAdapter, reportExports } from "./export-adapter";
import { reportExportRequest } from "./export-fixtures";
import type { ExportRequest } from "@caab/contracts";

const actor = (permissions = ["reports:read", "exports:generate", "members:read"]) => ({
  userId: "synthetic",
  sessionId: "synthetic",
  permissions: new Set(permissions),
});
const overview = (dataset = "summary", overrides: Partial<ExportRequest> = {}) =>
  reportExportRequest({
    dataset,
    columns: ["label", "value", "previous", "change", "definition"],
    sort: [],
    filters: { from: "2020-01-01", to: "2026-10-02", include_members: "yes", environment: "test" },
    ...overrides,
  });
describe("complete report exports", () => {
  it("keeps all detail adapters and registers both overviews and the eight grouping sources", () => {
    expect(reportExports).toHaveLength(19);
    const lookup = exportRegistry(reportExports);
    for (const adapter of reportExports) expect(lookup("reports", adapter.dataset)).toBe(adapter);
    expect(reportExportAdapter("accessGrouped")).toBeUndefined();
  });
  it.each(["summary", "executive"])(
    "exports %s in every format beyond 366 days using selected sources only",
    (dataset) => {
      const adapter = reportExportAdapter(dataset)!;
      for (const format of ["xlsx", "csv", "pdf"] as const) {
        const input = overview(dataset, { format });
        expect(() => authorizeExport(adapter, actor(), input)).not.toThrow();
        const sql = adapter.query(input);
        expect(sql.text).not.toMatch(/\bLIMIT\b|\bOFFSET\b/);
        expect(sql.text).not.toContain("scheduling_booking");
        expect(sql.text).not.toContain("partner_contract");
        expect(sql.text).toContain("FROM member");
        expect(sql.values[0]).toEqual(new Date("2020-01-01T03:00:00Z"));
      }
    },
  );
  it("hides and rejects unauthorized sources, including removal of permission mid-download", () => {
    const adapter = reportExportAdapter("summary")!;
    const catalog = authorizedCatalog(adapter, actor());
    expect(catalog.filters.map((filter) => filter.key)).toContain("include_members");
    expect(catalog.filters.map((filter) => filter.key)).not.toContain("include_bookings");
    const input = overview();
    expect(() =>
      authorizeExport(adapter, actor(["reports:read", "exports:generate"]), input),
    ).toThrow();
    for (const key of ["include_bookings", "include_partners", "include_users", "include_news"]) {
      expect(() =>
        authorizeExport(
          adapter,
          actor(),
          overview("summary", { filters: { ...input.filters, [key]: "yes" } }),
        ),
      ).toThrow();
    }
    for (const missing of ["reports:read", "exports:generate"]) {
      expect(() =>
        authorizeExport(
          adapter,
          actor(["reports:read", "exports:generate", "members:read"].filter((p) => p !== missing)),
          input,
        ),
      ).toThrow();
    }
  });
  it("does not add a domain omitted from the request and parametrizes management notes", () => {
    const adapter = reportExportAdapter("executive")!;
    const notes = "Análise '); DROP TABLE member; --";
    const sql = adapter.query(
      overview("executive", { filters: { from: "2020-01-01", to: "2026-01-01", notes } }),
    );
    expect(sql.text).not.toContain("FROM member");
    expect(sql.text).not.toContain(notes);
    expect(sql.values).toContain(notes);
    expect(sql.text).toContain("transaction_timestamp()");
  });
  it("rejects invalid dates, empty comparison bounds, extra filters, columns and source values", () => {
    const adapter = reportExportAdapter("summary")!;
    for (const filters of [
      { from: "2026-02-30" },
      { to: "2019-01-01" },
      { from: "" },
      { to: "" },
      { include_members: "anything" },
      { source: "'; DROP" },
      { unknown: "yes" },
    ] as Record<string, string>[])
      expect(() =>
        authorizeExport(
          adapter,
          actor(),
          overview("summary", { filters: { ...overview().filters, ...filters } }),
        ),
      ).toThrow();
    expect(() =>
      authorizeExport(adapter, actor(), overview("summary", { columns: ["cpf"] })),
    ).toThrow();
  });
  it("groups the full filtered dataset and preserves numeric sorting, order of columns and stable ties", () => {
    const adapter = reportExportAdapter("membersGrouped")!;
    const input = reportExportRequest({
      dataset: adapter.dataset,
      columns: ["count", "group"],
      filters: { from: "2020-01-01", to: "2026-10-02", groupBy: "city", search: "O'Hara" },
      sort: [{ field: "count", direction: "desc" }],
    });
    expect(() => authorizeExport(adapter, actor(), input)).not.toThrow();
    const sql = adapter.query(input);
    expect(sql.text).toContain("GROUP BY");
    expect(sql.text).toContain("ORDER BY (cells->>'count')::bigint DESC,id ASC");
    expect(sql.text).not.toMatch(/\bLIMIT\b|\bOFFSET\b/);
    expect(sql.text.indexOf('AS "count"')).toBeLessThan(sql.text.indexOf('AS "group"'));
    expect(sql.values).toContain("%O'Hara%");
    expect(sql.text).not.toContain("O'Hara");
    for (const groupBy of ["", "cpf", "city'); DROP"]) {
      expect(() =>
        authorizeExport(adapter, actor(), { ...input, filters: { ...input.filters, groupBy } }),
      ).toThrow();
    }
    expect(() => authorizeExport(adapter, actor(), { ...input, columns: ["name"] })).toThrow();
  });
});
