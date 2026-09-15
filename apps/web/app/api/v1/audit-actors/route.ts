import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { listAuditActors } from "@caab/db/repositories/audit-names";
import { createAuditActorsRoute } from "@/modules/audit/http/audit-actors-route";

export const GET = createAuditActorsRoute({
  resolveActor: resolveRequestActor,
  search: (query) => listAuditActors(getDatabase().pool, query),
});
