import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { allowedReports } from "@caab/db/repositories/reports";
import { ReportsPage } from "@/modules/reports/ui/reports-page";
import { analyticsEnvironment } from "@/modules/reports/ingest";
export default async function Page() {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/reports", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("reports:read"))
    return (
      <section className="panel">
        <h1>Relatórios e Análises</h1>
        <p role="alert">Você não tem permissão para acessar relatórios.</p>
      </section>
    );
  return <ReportsPage environment={analyticsEnvironment()} datasets={allowedReports(actor)} />;
}
