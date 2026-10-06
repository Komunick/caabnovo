import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { loadServerEnv } from "@caab/config";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { authorizedCatalog } from "@/modules/exports/catalog";
import { exportCsrf } from "@/modules/exports/http";
import { SchedulingExportScreen } from "@/modules/scheduling/ui/export-screen";
import { schedulingExportLabels } from "@/modules/scheduling/export-labels";
import { getExportPools } from "@/modules/exports/query";
import { schedulingExports } from "@/modules/scheduling/export-adapter";

export default async function SchedulingExportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/scheduling/exportar", { headers: await headers() }),
  );
  if (!actor?.permissions.has("scheduling:read") || !actor.permissions.has("exports:generate"))
    notFound();
  const query = await searchParams;
  const adapter = schedulingExports.find((item) => item.dataset === (query.dataset ?? "bookings"));
  if (!adapter) notFound();
  const catalog = authorizedCatalog(adapter, actor);
  const initialFilters = Object.fromEntries(
    catalog.filters.flatMap(({ key }) =>
      typeof query[key] === "string" ? [[key, query[key] as string]] : [],
    ),
  );
  return (
    <SchedulingExportScreen
      selectedLabels={await schedulingExportLabels(getExportPools().data, actor, initialFilters)}
      backHref={
        adapter.dataset === "catalog"
          ? `/scheduling/catalog?kind=${["units", "services", "procedures", "professionals", "assignments"].includes(initialFilters.kind ?? "") ? initialFilters.kind : "units"}`
          : adapter.dataset === "hours"
            ? "/scheduling/hours"
            : adapter.dataset === "absences"
              ? `/scheduling/absences?${new URLSearchParams(Object.entries(initialFilters).filter(([key]) => ["q", "status"].includes(key)))}`
              : "/scheduling"
      }
      initialFilters={initialFilters}
      catalog={{
        ...catalog,
        formats: ["xlsx", "csv", "pdf"],
        timezone: "America/Bahia",
        csrfToken: exportCsrf(actor, loadServerEnv().BETTER_AUTH_SECRET),
      }}
    />
  );
}
