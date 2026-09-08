import {
  auditListQuerySchema,
  auditPageSchema,
  type AuditListQuery,
  type AuditPage,
} from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import { auditRequestId, auditRouteError } from "./responses";

export function createAuditEventsRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  search(query: AuditListQuery, actor: RequestActor): Promise<AuditPage>;
}) {
  return {
    GET: async (request: Request) => {
      const requestId = auditRequestId(request);
      try {
        const actor = requirePermission(
          (await deps.resolveActor(request)) ?? undefined,
          PERMISSIONS.auditRead,
        );
        const query = auditListQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        );
        return Response.json(auditPageSchema.parse(await deps.search(query, actor)));
      } catch (error) {
        return auditRouteError(error, requestId);
      }
    },
  };
}
