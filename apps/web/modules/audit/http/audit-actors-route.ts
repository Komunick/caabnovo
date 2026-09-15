import { auditActorQuerySchema, auditActorPageSchema } from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import { auditRequestId, auditRouteError } from "./responses";

export function createAuditActorsRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  search(query: {
    q: string;
    cursor?: string;
    limit: number;
  }): Promise<{ items: { id: string; name: string }[]; nextCursor: string | null }>;
}) {
  return async (request: Request) => {
    const requestId = auditRequestId(request);
    try {
      const actor = requirePermission(
        (await deps.resolveActor(request)) ?? undefined,
        PERMISSIONS.auditRead,
      );
      requirePermission(actor, PERMISSIONS.usersRead);
      const query = auditActorQuerySchema.parse(
        Object.fromEntries(new URL(request.url).searchParams),
      );
      return Response.json(auditActorPageSchema.parse(await deps.search(query)), {
        headers: { "cache-control": "private, no-store" },
      });
    } catch (error) {
      return auditRouteError(error, requestId);
    }
  };
}
