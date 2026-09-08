import { idSchema, nonEmptyReasonSchema, roleChangeRequestSchema } from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { correlationId, requestId, routeErrorResponse, validateMutationRequest } from "./responses";

interface UserRoleRouteDependencies {
  resolveActor(request: Request): Promise<RequestActor | null>;
  grant(command: {
    actor: RequestActor;
    effectiveIdentity: string;
    requestId: string;
    correlationId: string;
    targetUserId: string;
    roleId: string;
    justification: string;
    validUntil?: Date | null;
  }): Promise<void>;
  revoke(command: {
    actor: RequestActor;
    effectiveIdentity: string;
    requestId: string;
    correlationId: string;
    targetUserId: string;
    roleId: string;
    reason: string;
  }): Promise<void>;
}

export function createUserRoleRoute(deps: UserRoleRouteDependencies) {
  async function context(request: Request, userIdValue: string, roleIdValue: string) {
    const actor = await deps.resolveActor(request);
    if (!actor) throw Object.assign(new Error("Authentication required"), { status: 401 });
    validateMutationRequest(request);
    return {
      actor,
      effectiveIdentity: `user:${actor.userId}`,
      requestId: requestId(request),
      correlationId: correlationId(request),
      targetUserId: idSchema.parse(userIdValue),
      roleId: idSchema.parse(roleIdValue),
    };
  }
  return {
    PUT: async (request: Request, userIdValue: string, roleIdValue: string) => {
      const id = requestId(request);
      try {
        const input = roleChangeRequestSchema.parse(await request.json());
        await deps.grant({
          ...(await context(request, userIdValue, roleIdValue)),
          justification: input.justification,
          validUntil: typeof input.validUntil === "string" ? new Date(input.validUntil) : null,
        });
        return new Response(null, { status: 204 });
      } catch (error) {
        return routeErrorResponse(error, id);
      }
    },
    DELETE: async (request: Request, userIdValue: string, roleIdValue: string) => {
      const id = requestId(request);
      try {
        const reason = nonEmptyReasonSchema.parse(
          new URL(request.url).searchParams.get("justification"),
        );
        await deps.revoke({ ...(await context(request, userIdValue, roleIdValue)), reason });
        return new Response(null, { status: 204 });
      } catch (error) {
        return routeErrorResponse(error, id);
      }
    },
  };
}
