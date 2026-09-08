import {
  finalizeUploadRequestSchema,
  idSchema,
  jobReferenceSchema,
  type FinalizeUploadRequest,
  type JobReference,
} from "@caab/contracts";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import type { RequestActor } from "../../shared/request-context";
import { observeHttpRequest } from "../../shared/metrics";
import { correlationId, requestId, routeError, validateMutation } from "./responses";

interface RouteContext {
  params: Promise<{ fileId: string }>;
}

export function createFinalizeUploadRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  finalize(
    command: FinalizeUploadRequest & {
      fileId: string;
      actor: RequestActor;
      effectiveIdentity: string;
      requestId: string;
      correlationId: string;
    },
  ): Promise<JobReference>;
}) {
  return {
    POST: (request: Request, context: RouteContext) =>
      observeHttpRequest(request, "/api/v1/files/{fileId}/finalize", async () => {
        const currentRequestId = requestId(request);
        try {
          const actor = requirePermission(
            (await deps.resolveActor(request)) ?? undefined,
            PERMISSIONS.filesCreate,
          );
          validateMutation(request, false);
          const { fileId } = await context.params;
          const input = finalizeUploadRequestSchema.parse(await request.json());
          const job = await deps.finalize({
            ...input,
            fileId: idSchema.parse(fileId),
            actor,
            effectiveIdentity: `user:${actor.userId}`,
            requestId: currentRequestId,
            correlationId: correlationId(request),
          });
          return Response.json(jobReferenceSchema.parse(job), { status: 202 });
        } catch (error) {
          return routeError(error, currentRequestId);
        }
      }),
  };
}
