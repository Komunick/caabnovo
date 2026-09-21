import {
  idSchema,
  resetUserPasswordSchema,
  resetUserPasswordResponseSchema,
} from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import { correlationId, requestId, routeErrorResponse, validateMutationRequest } from "./responses";

export function createResetPasswordRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  reset(command: {
    actor: RequestActor;
    userId: string;
    version: number;
    requestId: string;
    correlationId: string;
  }): Promise<{ initialPassword: string; version: number }>;
}) {
  return async (request: Request, userIdValue: string) => {
    const rid = requestId(request);
    let response: Response;
    try {
      const actor = requirePermission(
        (await deps.resolveActor(request)) ?? undefined,
        PERMISSIONS.usersRead,
      );
      requirePermission(actor, PERMISSIONS.usersResetPassword);
      validateMutationRequest(request);
      const userId = idSchema.parse(userIdValue);
      const input = resetUserPasswordSchema.parse(await request.json().catch(() => null));
      response = Response.json(
        resetUserPasswordResponseSchema.parse(
          await deps.reset({
            actor,
            userId,
            ...input,
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
