import { idSchema, userLifecycleSchema, userSchema, type User } from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import { requestId, correlationId, validateMutationRequest, routeErrorResponse } from "./responses";
export function createUserLifecycleRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  change(command: {
    actor: RequestActor;
    userId: string;
    action: "delete" | "restore";
    version: number;
    effectiveIdentity: string;
    requestId: string;
    correlationId: string;
  }): Promise<User>;
}) {
  return async (request: Request, userIdValue: string) => {
    const rid = requestId(request);
    try {
      const actor = requirePermission(
        (await deps.resolveActor(request)) ?? undefined,
        PERMISSIONS.usersRead,
      );
      validateMutationRequest(request);
      const input = userLifecycleSchema.parse(await request.json().catch(() => null));
      requirePermission(
        actor,
        input.action === "delete" ? PERMISSIONS.usersDelete : PERMISSIONS.usersUpdate,
      );
      const result = await deps.change({
        ...input,
        actor,
        userId: idSchema.parse(userIdValue),
        effectiveIdentity: `user:${actor.userId}`,
        requestId: rid,
        correlationId: correlationId(request),
      });
      return Response.json(userSchema.parse(result), {
        headers: { "cache-control": "private, no-store" },
      });
    } catch (error) {
      return routeErrorResponse(error, rid);
    }
  };
}
