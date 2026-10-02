import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { loadServerEnv } from "@caab/config";
import { reportPreset } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { authorizedCatalog } from "@/modules/exports/catalog";
import { exportCsrf } from "@/modules/exports/http";
import { reportExportAdapter } from "@/modules/reports/export-adapter";
import { type ExportInitial } from "@/modules/exports/ui/export-screen";
import { ReportExportScreen } from "@/modules/reports/ui/report-export-screen";

type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
/**
 * Direct export of the detailed analysis (CAAB-24, spec 010 T034). The details tab links here with
 * its applied filters, columns and order; this page only pre-fills the screen, and every value is
 * validated again by the adapter when the download starts.
 */
export default async function ReportExportPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/reports/exportar", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  const params = await searchParams;
  const adapter = reportExportAdapter(one(params.dataset) || "members");
  if (!adapter) notFound();
  let catalog;
  try {
    catalog = authorizedCatalog(adapter, actor);
  } catch {
    notFound();
  }
  const filterKeys = new Set(catalog.filters.map((filter) => filter.key));
  const columnKeys = new Set(catalog.columns.map((column) => column.key));
  // "Todos os registros" on the screen means no date bounds in the file.
  const overview = ["summary", "executive"].includes(adapter.dataset);
  const grouped = adapter.dataset.endsWith("Grouped");
  const everything = !overview && one(params.dateScope) === "all" && adapter.dataset !== "access";
  const filters = Object.fromEntries(
    [...filterKeys]
      .filter((key) => !(everything && (key === "from" || key === "to")))
      .map((key) => [key, one(params[key]).slice(0, key === "notes" ? 2000 : 120)] as const)
      .filter(([, value]) => value !== ""),
  );
  if (overview) {
    const preset = reportPreset("month");
    filters.from ??= preset.from;
    filters.to ??= preset.to;
    filters.environment ||= "production";
    for (const key of filterKeys) if (key.startsWith("include_")) filters[key] ??= "yes";
  }
  const columns = one(params.columns)
    .split(",")
    .filter((key, index, all) => columnKeys.has(key) && all.indexOf(key) === index);
  const sort = columnKeys.has(one(params.sort))
    ? one(params.sort)
    : overview
      ? ""
      : grouped
        ? "count"
        : "date";
  const initial: ExportInitial = {
    filters,
    ...(columns.length ? { columns } : {}),
    sort,
    direction: one(params.direction) === "asc" ? "asc" : "desc",
  };
  return (
    <ReportExportScreen
      sourcePermission="reports:read"
      backHref="/reports"
      backLabel="Voltar aos relatórios"
      defaultOrderLabel={
        overview
          ? "Seção e indicador"
          : grouped
            ? "Quantidade (maior primeiro)"
            : "Data (mais recente primeiro)"
      }
      context={{ source: "reports" }}
      initial={initial}
      catalog={{
        ...catalog,
        formats: ["xlsx", "csv", "pdf"],
        timezone: "America/Bahia",
        csrfToken: exportCsrf(actor, loadServerEnv().BETTER_AUTH_SECRET),
      }}
    />
  );
}
