import { PanelHeading } from "@/components/ui/panel-heading";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auditListQuerySchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { getDatabase } from "@/modules/shared/database";
import { searchAuditEvents } from "@/modules/audit/audit-query-service";
import { AuditTimeline } from "@/modules/audit/ui/audit-timeline";
import { AuditExportDialog } from "@/modules/audit/ui/audit-export-dialog";
import { AuditFilters } from "@/modules/audit/ui/audit-filters";
import { AuditNavigation } from "@/modules/audit/ui/audit-navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditPage({
  searchParams,
}: Readonly<{ searchParams: SearchParams }>) {
  const requestHeaders = await headers();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/audit", { headers: requestHeaders }),
  );
  if (!actor?.permissions.has(PERMISSIONS.auditRead)) {
    if (actor?.permissions.has(PERMISSIONS.jobsRead)) redirect("/audit/jobs");
    return <p role="alert">Você não tem permissão para acessar a auditoria.</p>;
  }
  const raw = await searchParams;
  const values = {
    cursor: single(raw.cursor),
    actorId: single(raw.actorId),
    action: single(raw.action),
    entityType: single(raw.entityType),
    from: single(raw.from),
    to: single(raw.to),
    limit: single(raw.limit),
    period: single(raw.period),
  };
  const parsed = auditListQuerySchema.safeParse(
    Object.fromEntries(Object.entries(values).filter(([, value]) => value)),
  );
  const query = parsed.success ? parsed.data : auditListQuerySchema.parse({});
  const page = await searchAuditEvents(getDatabase().pool, actor, {
    ...query,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
  });
  const nextParams = new URLSearchParams(
    Object.entries({ ...values, cursor: page.nextCursor ?? undefined }).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1]),
    ),
  );

  return (
    <div className="page-stack audit-page">
      <header className="audit-page-heading">
        <div>
          <h1>Auditoria</h1>
          <p>Quem fez, o que mudou e quando aconteceu.</p>
        </div>
      </header>
      <AuditNavigation
        events={actor.permissions.has(PERMISSIONS.auditRead)}
        jobs={actor.permissions.has(PERMISSIONS.jobsRead)}
      />
      <section className="audit-filter-panel" aria-labelledby="audit-filters-title">
        <PanelHeading id="audit-filters-title" title="Filtros de atividades">
          {actor.permissions.has(PERMISSIONS.auditExport) ? (
            <AuditExportDialog
              filters={{
                ...(query.actorId ? { actorId: query.actorId } : {}),
                ...(query.action ? { action: query.action } : {}),
                ...(query.entityType ? { entityType: query.entityType } : {}),
                ...(query.from ? { from: query.from } : {}),
                ...(query.to ? { to: query.to } : {}),
              }}
            />
          ) : null}
        </PanelHeading>
        {!parsed.success ? (
          <p role="alert">Um ou mais filtros foram ignorados por serem inválidos.</p>
        ) : null}
        <AuditFilters
          key={JSON.stringify(values)}
          values={values}
          canReadPeople={actor.permissions.has(PERMISSIONS.usersRead)}
          selectedActorName={
            page.items.find((event) => event.actorUserId === values.actorId)?.presentation
              .actorLabel
          }
        />
      </section>
      <AuditTimeline
        events={page.items}
        nextHref={page.nextCursor ? `/audit?${nextParams.toString()}` : undefined}
      />
    </div>
  );
}
