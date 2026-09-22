import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { loadServerEnv } from "@caab/config";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { authorizedCatalog } from "@/modules/exports/catalog";
import { exportCsrf } from "@/modules/exports/http";
import { usersExport } from "@/modules/users/export-adapter";
import { ExportScreen } from "@/modules/exports/ui/export-screen";
export default async function UserExportsPage() {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/users/exportar", { headers: await headers() }),
  );
  if (!actor?.permissions.has("users:read") || !actor.permissions.has("exports:generate"))
    notFound();
  return (
    <ExportScreen
      sourcePermission="users:read"
      backHref="/users"
      catalog={{
        ...authorizedCatalog(usersExport, actor),
        formats: ["xlsx", "csv", "pdf"],
        timezone: "America/Bahia",
        csrfToken: exportCsrf(actor, loadServerEnv().BETTER_AUTH_SECRET),
      }}
    />
  );
}
