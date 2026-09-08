import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { searchAuditEvents } from "@/modules/audit/audit-query-service";
import { createAuditEventsRoute } from "@/modules/audit/http/audit-events-route";

const route = createAuditEventsRoute({
  resolveActor: resolveRequestActor,
  search: (query, actor) =>
    searchAuditEvents(getDatabase().pool, actor, {
      ...query,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    }),
});

export const GET = route.GET;
