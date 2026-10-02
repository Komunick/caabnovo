import type { ExportRequest } from "@caab/contracts";

/**
 * Synthetic data for the report export tests (spec 010 T028). Test-only: no real person, no
 * production shape beyond the member columns the report reads.
 *
 * 100 members "Relatório export 001…100", one every 6 days from 2024-01-02 (period of ~600 days,
 * longer than the screen's 366), with ties on created_at every 10th pair, a very long name, a name
 * that starts like a spreadsheet formula and two cities for combined filters.
 */
export const REPORT_EXPORT_MEMBERS = 100;
export const REPORT_EXPORT_FROM = "2024-01-01";
export const REPORT_EXPORT_TO = "2026-09-30";
/** As long as a member name can be (160 characters, member_name_check). */
export const LONG_NAME = `Relatório export 050 ${"texto longo ".repeat(20)}`.slice(0, 159) + "x";
export const FORMULA_NAME = '=HYPERLINK("http://exemplo.invalido") Relatório export 051';
export const seedReportExportMembers = `
INSERT INTO member(name,city,category,created_at)
SELECT CASE n WHEN 50 THEN $1 WHEN 51 THEN $2 ELSE 'Relatório export '||lpad(n::text,3,'0') END,
       CASE WHEN n % 4 = 0 THEN 'Ilhéus' ELSE 'Salvador' END,
       'Advocacia',
       '2024-01-02T15:00:00Z'::timestamptz + (CASE WHEN n % 10 = 0 THEN n-1 ELSE n END) * interval '6 days'
FROM generate_series(1,${REPORT_EXPORT_MEMBERS}) n`;
export const seedReportExportValues = [LONG_NAME, FORMULA_NAME];
export function reportExportRequest(
  overrides: Partial<ExportRequest> & Pick<ExportRequest, "dataset">,
): ExportRequest {
  return {
    module: "reports",
    format: "csv",
    filters: { from: REPORT_EXPORT_FROM, to: REPORT_EXPORT_TO, search: "Relatório export" },
    sort: [{ field: "name", direction: "asc" }],
    columns: ["date", "name", "city"],
    context: { source: "reports" },
    ...overrides,
  };
}
/** Permissions of a manager who can read members and export reports. */
export const reportExporter = ["reports:read", "members:read", "exports:generate"] as const;
