import "server-only";
import {
  reportCatalog,
  reportOverviewFiltersSchema,
  type ExportFilter,
  type ReportDataset,
} from "@caab/contracts";
import {
  overviewColumns,
  reportOverviewExportSql,
} from "@caab/db/repositories/report-overview-export";
import { ExportError, type ExportAdapter } from "../exports/catalog";

const datasets = (Object.keys(reportCatalog) as ReportDataset[]).filter((key) => key !== "access");
const filters: ExportFilter[] = [
  { key: "from", label: "Data inicial da comparação", type: "date" },
  { key: "to", label: "Data final da comparação", type: "date" },
  {
    key: "channel",
    label: "Canal de acesso",
    type: "choice",
    options: [
      { value: "admin", label: "Painel" },
      { value: "site", label: "Site" },
      { value: "app", label: "App" },
    ],
  },
  {
    key: "environment",
    label: "Ambiente",
    type: "choice",
    options: [
      { value: "production", label: "Produção" },
      { value: "development", label: "Desenvolvimento" },
      { value: "test", label: "Teste" },
    ],
  },
  { key: "source", label: "Fonte de acesso", type: "text" },
  { key: "notes", label: "Análise da gestão (opcional)", type: "text" },
  ...datasets.map((key): ExportFilter => ({
    key: `include_${key}`,
    label: reportCatalog[key].label,
    type: "choice",
    permission: reportCatalog[key].permission,
    options: [
      { value: "yes", label: "Incluir" },
      { value: "no", label: "Não incluir" },
    ],
  })),
];
const numeric = new Set(["value", "previous", "change"]);
function overviewAdapter(dataset: "summary" | "executive"): ExportAdapter {
  return {
    module: "reports",
    dataset,
    label: dataset === "summary" ? "Resumo gerencial" : "Resultados e evolução",
    permission: "reports:read",
    requires: ["reports:read"],
    scope: "module",
    columns: Object.entries(overviewColumns).map(([key, label]) => ({
      key,
      label,
      scalarType: numeric.has(key) ? "number" : "text",
      defaultSelected: true,
      sortable: true,
    })),
    filters,
    query(input) {
      const invalid = () => {
        throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
      };
      const text = (key: string, max: number) => {
        const value = input.filters[key] ?? "";
        if (typeof value !== "string" || value.length > max) return invalid();
        return value.trim();
      };
      const from = text("from", 10),
        to = text("to", 10);
      const channel = text("channel", 10) || "all",
        environment = text("environment", 20) || "production";
      const source = text("source", 80);
      const parsed = reportOverviewFiltersSchema.safeParse({
        from,
        to,
        channel,
        environment,
        source,
        notes: text("notes", 2000),
      });
      if (!parsed.success) return invalid();
      for (const key of datasets)
        if (!["", "yes", "no"].includes(text(`include_${key}`, 3))) invalid();
      return reportOverviewExportSql(
        {
          ...parsed.data,
          datasets: datasets.filter((key) => input.filters[`include_${key}`] === "yes"),
        },
        input.columns,
        input.sort,
      );
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
export const overviewExports = [overviewAdapter("summary"), overviewAdapter("executive")];
