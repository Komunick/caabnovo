import "server-only";
import {
  reportCatalog,
  reportDaySchema,
  type ExportFilter,
  type ExportRequest,
  type ReportDataset,
} from "@caab/contracts";
import { reportExportSql, type ReportExportQuery } from "@caab/db/repositories/reports";
import { ExportError, type ExportAdapter } from "../exports/catalog";
import { overviewExports } from "./overview-export-adapter";

/**
 * Direct export of the detailed analysis (CAAB-24, spec 010 T033): one adapter per report source,
 * built from the same catalog as the screen. The complete selection goes through the cursor of the
 * 001 export core, without the screen's page size, the legacy 50k cap or the 366-day window.
 */
const numeric = new Set(["age", "views", "sessions", "visitors"]);
/** Screen filter → catalog column it searches, only offered when the source has that column. */
const textFilters = [
  ["search", "name"],
  ["status", "status"],
  ["category", "category"],
  ["city", "city"],
] as const;
const accessFilters: ExportFilter[] = [
  {
    key: "channel",
    label: "Canal",
    type: "choice",
    options: [
      { value: "admin", label: "Painel" },
      { value: "site", label: "Site" },
      { value: "app", label: "App" },
    ],
  },
  {
    key: "environment",
    label: "Ambiente (padrão: produção)",
    type: "choice",
    options: [
      { value: "production", label: "Produção" },
      { value: "development", label: "Desenvolvimento" },
      { value: "test", label: "Teste" },
    ],
  },
  { key: "source", label: "Fonte", type: "text" },
];
const invalid = () => new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
function text(input: ExportRequest, key: string, max: number) {
  const value = input.filters[key] ?? "";
  if (typeof value !== "string" || value.trim().length > max) throw invalid();
  return value.trim();
}
function day(input: ExportRequest, key: "from" | "to") {
  const value = text(input, key, 10);
  if (value && !reportDaySchema.safeParse(value).success) throw invalid();
  return value;
}
/** Export filters → the report query the screen would run, minus page and grouping. */
export function reportExportQuery(dataset: ReportDataset, input: ExportRequest): ReportExportQuery {
  const from = day(input, "from"),
    to = day(input, "to");
  if (from && to && from > to) throw invalid();
  const source = text(input, "source", 80);
  if (!/^[a-z0-9.-]*$/.test(source)) throw invalid();
  const channel = text(input, "channel", 10) || "all";
  const environment = text(input, "environment", 20) || "production";
  if (!["all", "admin", "site", "app"].includes(channel)) throw invalid();
  if (!["production", "development", "test"].includes(environment)) throw invalid();
  // Missing bounds stay open, including the period used to aggregate access counts.
  const everything = !from && !to;
  return {
    dataset,
    from,
    to,
    dateScope: everything ? "all" : "period",
    search: text(input, "search", 120),
    status: text(input, "status", 80),
    category: text(input, "category", 120),
    city: text(input, "city", 120),
    channel: channel as ReportExportQuery["channel"],
    environment: environment as ReportExportQuery["environment"],
    source,
  };
}
function reportAdapter(dataset: ReportDataset, grouped = false): ExportAdapter {
  const source = reportCatalog[dataset];
  const sourceFields = source.columns as Record<string, string>;
  const fields = grouped ? { group: "Grupo", count: "Quantidade" } : sourceFields;
  return {
    module: "reports",
    dataset: grouped ? `${dataset}Grouped` : dataset,
    label: grouped ? `${source.label} por grupo` : source.label,
    permission: source.permission,
    requires: ["reports:read"],
    scope: "module",
    columns: Object.entries(fields).map(([key, label]) => ({
      key,
      label,
      scalarType: numeric.has(key) || key === "count" ? "number" : key === "date" ? "date" : "text",
      defaultSelected: true,
      sortable: true,
    })),
    filters: [
      { key: "from", label: `${source.dateLabel}: a partir de`, type: "date" },
      { key: "to", label: `${source.dateLabel}: até`, type: "date" },
      ...textFilters
        .filter(([, field]) => Object.hasOwn(sourceFields, field))
        .map(([key, field]): ExportFilter => ({ key, label: sourceFields[field]!, type: "text" })),
      ...(grouped
        ? [
            {
              key: "groupBy",
              label: "Agrupar por",
              type: "choice" as const,
              options: Object.entries(sourceFields).map(([value, label]) => ({ value, label })),
            },
          ]
        : []),
      ...(dataset === "access" ? accessFilters : []),
    ],
    query(input) {
      try {
        const groupBy = grouped ? text(input, "groupBy", 30) : "";
        if (grouped && !Object.hasOwn(sourceFields, groupBy)) throw invalid();
        return reportExportSql(
          { ...reportExportQuery(dataset, input), groupBy },
          input.columns,
          input.sort,
        );
      } catch (error) {
        if (error instanceof ExportError) throw error;
        throw invalid();
      }
    },
    map(row) {
      return {
        id: String(row._recordId),
        values: Object.fromEntries(
          Object.entries(row)
            .filter(([key]) => key !== "_recordId")
            .map(([key, value]) => [
              key,
              value == null ? null : typeof value === "number" ? value : String(value),
            ]),
        ),
      };
    },
  };
}
export const reportDetailExports = (Object.keys(reportCatalog) as ReportDataset[]).map((dataset) =>
  reportAdapter(dataset),
);
export const reportExports = [
  ...reportDetailExports,
  ...(Object.keys(reportCatalog) as ReportDataset[])
    .filter((dataset) => dataset !== "access")
    .map((dataset) => reportAdapter(dataset, true)),
  ...overviewExports,
];
export function reportExportAdapter(dataset: string) {
  return reportExports.find((adapter) => adapter.dataset === dataset);
}
