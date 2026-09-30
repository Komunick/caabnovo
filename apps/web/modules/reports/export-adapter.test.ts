import { describe, expect, it } from "vitest";
import { reportCatalog } from "@caab/contracts";
import { authorizeExport, authorizedCatalog } from "../exports/catalog";
import { reportExportAdapter, reportExportQuery, reportExports } from "./export-adapter";
import { reportExportRequest, reportExporter } from "./export-fixtures";

/** Spec 010 T032: report export adapter, without database. */
const members = reportExportAdapter("members")!;
const bookings = reportExportAdapter("bookings")!;
const actor = (permissions: readonly string[]) => ({
  userId: "synthetic",
  sessionId: "synthetic",
  permissions: new Set(permissions),
});

describe("report export adapter", () => {
  it("registers one adapter per report source under the reports module", () => {
    expect(reportExports.map((adapter) => adapter.dataset).sort()).toEqual(
      Object.keys(reportCatalog).sort(),
    );
    for (const adapter of reportExports) {
      expect(adapter.module).toBe("reports");
      expect(adapter.requires).toEqual(["reports:read"]);
    }
  });

  it("selects the requested columns in the requested order, with a stable tie-break", () => {
    const { text } = members.query(
      reportExportRequest({
        dataset: "members",
        columns: ["city", "date", "name"],
        sort: [{ field: "date", direction: "asc" }],
      }),
    );
    const select = text.slice(0, text.indexOf(" FROM "));
    expect(select.indexOf('"city"')).toBeLessThan(select.indexOf('"date"'));
    expect(select.indexOf('"date"')).toBeLessThan(select.indexOf('"name"'));
    expect(text).toMatch(/ORDER BY at ASC,id ASC$/);
    expect(text).not.toMatch(/LIMIT|OFFSET/);
  });

  it("keeps every filter value out of the SQL text", () => {
    const injection = "' OR true --";
    const { text, values } = members.query(
      reportExportRequest({
        dataset: "members",
        filters: { search: injection, city: injection, status: injection, category: injection },
      }),
    );
    expect(text).not.toContain(injection);
    expect(values).toContain(`%${injection}%`);
    expect(values).toContain(injection);
  });

  it("exports periods longer than the screen's 366 days and everything without dates", () => {
    const long = reportExportQuery(
      "members",
      reportExportRequest({
        dataset: "members",
        filters: { from: "2020-01-01", to: "2026-09-30" },
      }),
    );
    expect(long).toMatchObject({ from: "2020-01-01", to: "2026-09-30", dateScope: "period" });
    const open = reportExportQuery(
      "members",
      reportExportRequest({ dataset: "members", filters: {} }),
      "2026-09-30",
    );
    expect(open.dateScope).toBe("all");
    const half = reportExportQuery(
      "members",
      reportExportRequest({ dataset: "members", filters: { to: "2025-12-31" } }),
    );
    expect(half).toMatchObject({ from: "2000-01-01", to: "2025-12-31", dateScope: "period" });
  });

  it("bounds access counts by a period and defaults to production", () => {
    const access = reportExportQuery(
      "access",
      reportExportRequest({ dataset: "access", filters: {} }),
      "2026-09-30",
    );
    expect(access).toMatchObject({
      dateScope: "period",
      to: "2026-09-30",
      environment: "production",
      channel: "all",
    });
  });

  it("rejects unknown or restricted columns, invalid sort, inverted periods and bad sources", () => {
    const canExport = actor(reportExporter);
    const invalid = { code: "EXPORT_CONFIGURATION_INVALID" };
    for (const request of [
      reportExportRequest({ dataset: "members", columns: ["name", "cpf"] }),
      reportExportRequest({ dataset: "members", columns: ["name", "professional"] }),
      reportExportRequest({ dataset: "members", sort: [{ field: "email", direction: "asc" }] }),
      reportExportRequest({
        dataset: "members",
        filters: { from: "2026-09-30", to: "2026-01-01" },
      }),
      reportExportRequest({ dataset: "members", filters: { from: "30/09/2026" } }),
      reportExportRequest({ dataset: "members", filters: { unknown: "x" } }),
    ])
      expect(() => authorizeExport(members, canExport, request)).toThrow(
        expect.objectContaining(invalid),
      );
    expect(() =>
      reportExportAdapter("access")!.query(
        reportExportRequest({ dataset: "access", filters: { source: "Robert'); DROP" } }),
      ),
    ).toThrow(expect.objectContaining(invalid));
  });

  it("requires reports:read, exports:generate and the source permission", () => {
    const request = reportExportRequest({ dataset: "members" });
    expect(() => authorizeExport(members, actor(reportExporter), request)).not.toThrow();
    for (const missing of reportExporter)
      expect(() =>
        authorizeExport(
          members,
          actor(reportExporter.filter((permission) => permission !== missing)),
          request,
        ),
      ).toThrow(expect.objectContaining({ code: "PERMISSION_DENIED" }));
  });

  it("requires scheduling:read for bookings", () => {
    const request = reportExportRequest({ dataset: "bookings", columns: ["date", "name"] });
    expect(() =>
      authorizeExport(bookings, actor(["reports:read", "exports:generate"]), request),
    ).toThrow(expect.objectContaining({ code: "PERMISSION_DENIED" }));
    expect(() =>
      authorizeExport(
        bookings,
        actor(["reports:read", "exports:generate", "scheduling:read"]),
        request,
      ),
    ).not.toThrow();
    expect(() =>
      authorizedCatalog(bookings, actor(["reports:read", "exports:generate", "members:read"])),
    ).toThrow();
  });

  it("offers only the filters each source has", () => {
    const keys = (dataset: string) =>
      reportExportAdapter(dataset)!.filters.map((filter) => filter.key);
    expect(keys("members")).toEqual(["from", "to", "search", "status", "category", "city"]);
    expect(keys("users")).toEqual(["from", "to", "search", "status"]);
    expect(keys("access")).toEqual(["from", "to", "search", "channel", "environment", "source"]);
  });

  it("maps rows to the export shape, keeping numbers and empty values", () => {
    expect(
      members.map({ _recordId: "a1", name: "Pessoa", age: 41, city: null, date: "2026-09-30" }),
    ).toEqual({
      id: "a1",
      values: { name: "Pessoa", age: 41, city: null, date: "2026-09-30" },
    });
  });
});
