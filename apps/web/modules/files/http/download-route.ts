import { downloadGrantSchema, idSchema, type DownloadGrant } from "@caab/contracts";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import type { RequestActor } from "../../shared/request-context";
import { observeHttpRequest } from "../../shared/metrics";
import { requestId, routeError } from "./responses";

interface RouteContext {
  params: Promise<{ fileId: string }>;
}

export function createDownloadRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  createGrant(actor: RequestActor, fileId: string): Promise<DownloadGrant>;
}) {
  return {
    GET: (request: Request, context: RouteContext) =>
      observeHttpRequest(request, "/api/v1/files/{fileId}/download", async () => {
        const currentRequestId = requestId(request);
        try {
          const actor = requirePermission(
            (await deps.resolveActor(request)) ?? undefined,
            PERMISSIONS.filesRead,
          );
          const { fileId } = await context.params;
          const grant = await deps.createGrant(actor, idSchema.parse(fileId));
          return Response.json(downloadGrantSchema.parse(grant));
        } catch (error) {
          return routeError(error, currentRequestId);
        }
      }),
  };
}
