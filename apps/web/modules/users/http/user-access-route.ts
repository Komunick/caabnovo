import { idSchema, userAccessChangeSchema } from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import type { changeUserAccess } from "../user-access-service";
import { correlationId, requestId, routeErrorResponse, validateMutationRequest } from "./responses";

export function createUserAccessRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  change(command: Parameters<typeof changeUserAccess>[1]): ReturnType<typeof changeUserAccess>;
}) {
  return async (request: Request, userId: string) => {
    const id = requestId(request);
    try {
      const actor = await deps.resolveActor(request);
      if (!actor) throw Object.assign(new Error("Authentication required"), { status: 401 });
      if (
        !actor.permissions.has("users:read") ||
        (!actor.permissions.has("roles:grant") && !actor.permissions.has("roles:revoke"))
      )
        throw Object.assign(new Error("Permission denied"), { status: 403 });
      validateMutationRequest(request);
      const input = userAccessChangeSchema.parse(await request.json().catch(() => null));
      const result = await deps.change({
        actor,
        targetUserId: idSchema.parse(userId),
        input,
        requestId: id,
        correlationId: correlationId(request),
      });
      return Response.json(result, { headers: { "cache-control": "private, no-store" } });
    } catch (error) {
      return routeErrorResponse(error, id);
    }
  };
}
