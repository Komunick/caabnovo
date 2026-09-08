import { headers } from "next/headers";
import { auditListQuerySchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { getDatabase } from "@/modules/shared/database";
import { searchAuditEvents } from "@/modules/audit/audit-query-service";
import { AuditTable } from "@/modules/audit/ui/audit-table";
import { AuditExportDialog } from "@/modules/audit/ui/audit-export-dialog";
import { AuditFilters } from "@/modules/audit/ui/audit-filters";

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
    <div className="page-stack">
      <header>
        <p className="eyebrow">Integridade e rastreabilidade</p>
        <h1>Auditoria</h1>
        <p>Consulte eventos críticos redigidos. Esta área é somente leitura.</p>
      </header>
      <section className="panel" aria-labelledby="audit-filters-title">
        <h2 id="audit-filters-title">Filtros</h2>
        {!parsed.success ? (
          <p role="alert">Um ou mais filtros foram ignorados por serem inválidos.</p>
        ) : null}
        <AuditFilters values={values} />
        {actor.permissions.has(PERMISSIONS.auditExport) ? (
          <AuditExportDialog
            filters={{
              ...(query.actorId ? { actorId: query.actorId } : {}),
              ...(query.action ? { action: query.action } : {}),
              ...(query.entityType ? { entityType: query.entityType } : {}),
            }}
          />
        ) : null}
      </section>
      <AuditTable
        events={page.items}
        nextHref={page.nextCursor ? `/audit?${nextParams.toString()}` : undefined}
      />
    </div>
  );
}
