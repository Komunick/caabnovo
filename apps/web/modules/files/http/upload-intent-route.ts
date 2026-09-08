import {
  createUploadIntentRequestSchema,
  uploadIntentSchema,
  type CreateUploadIntentRequest,
  type UploadIntent,
} from "@caab/contracts";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import type { RequestActor } from "../../shared/request-context";
import { observeHttpRequest } from "../../shared/metrics";
import { correlationId, requestId, routeError, validateMutation } from "./responses";

export function createUploadIntentRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  create(
    command: CreateUploadIntentRequest & {
      actor: RequestActor;
      effectiveIdentity: string;
      requestId: string;
      correlationId: string;
      idempotencyKey: string;
    },
  ): Promise<UploadIntent>;
}) {
  return {
    POST: (request: Request) =>
      observeHttpRequest(request, "/api/v1/files/upload-intents", async () => {
        const currentRequestId = requestId(request);
        try {
          const actor = requirePermission(
            (await deps.resolveActor(request)) ?? undefined,
            PERMISSIONS.filesCreate,
          );
          const idempotencyKey = validateMutation(request, true)!;
          const input = createUploadIntentRequestSchema.parse(await request.json());
          const intent = await deps.create({
            ...input,
            actor,
            effectiveIdentity: `user:${actor.userId}`,
            requestId: currentRequestId,
            correlationId: correlationId(request),
            idempotencyKey,
          });
          return Response.json(uploadIntentSchema.parse(intent), { status: 201 });
        } catch (error) {
          return routeError(error, currentRequestId);
        }
      }),
  };
}
