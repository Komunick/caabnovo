import { idSchema } from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { correlationId, requestId, routeErrorResponse, validateMutationRequest } from "./responses";

export function createPromoteRoleRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  promote(command: {
    actor: RequestActor;
    effectiveIdentity: string;
    requestId: string;
    correlationId: string;
    targetUserId: string;
    roleId: string;
  }): Promise<void>;
}) {
  return {
    POST: async (request: Request, userId: string, roleId: string) => {
      const id = requestId(request);
      try {
        const actor = await deps.resolveActor(request);
        if (!actor) throw Object.assign(new Error("Authentication required"), { status: 401 });
        validateMutationRequest(request);
        await deps.promote({
          actor,
          effectiveIdentity: `user:${actor.userId}`,
          requestId: id,
          correlationId: correlationId(request),
          targetUserId: idSchema.parse(userId),
          roleId: idSchema.parse(roleId),
        });
        return new Response(null, { status: 204 });
      } catch (error) {
        return routeErrorResponse(error, id);
      }
    },
  };
}
