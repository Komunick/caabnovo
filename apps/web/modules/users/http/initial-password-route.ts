import { idSchema, initialPasswordResponseSchema } from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import { correlationId, requestId, routeErrorResponse, validateMutationRequest } from "./responses";

export function createInitialPasswordRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  initialize(command: {
    actor: RequestActor;
    userId: string;
    requestId: string;
    correlationId: string;
  }): Promise<{ initialPassword: string }>;
}) {
  return async (request: Request, userIdValue: string) => {
    const rid = requestId(request);
    let response: Response;
    try {
      const actor = requirePermission(
        (await deps.resolveActor(request)) ?? undefined,
        PERMISSIONS.usersCreate,
      );
      requirePermission(actor, PERMISSIONS.usersUpdate);
      requirePermission(actor, PERMISSIONS.rolesGrant);
      validateMutationRequest(request);
      const userId = idSchema.parse(userIdValue);
      response = Response.json(
        initialPasswordResponseSchema.parse(
          await deps.initialize({
            actor,
            userId,
            requestId: rid,
            correlationId: correlationId(request),
          }),
        ),
      );
    } catch (error) {
      response = routeErrorResponse(error, rid);
    }
    response.headers.set("cache-control", "private, no-store");
    return response;
  };
}
