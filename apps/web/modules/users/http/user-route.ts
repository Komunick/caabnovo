import {
  idSchema,
  updateUserRequestSchema,
  userSchema,
  type UpdateUserRequest,
  type User,
} from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { correlationId, requestId, routeErrorResponse, validateMutationRequest } from "./responses";

interface UserRouteDependencies {
  resolveActor(request: Request): Promise<RequestActor | null>;
  update(
    command: UpdateUserRequest & {
      userId: string;
      actor: RequestActor;
      effectiveIdentity: string;
      requestId: string;
      correlationId: string;
    },
  ): Promise<User>;
}

export function createUserRoute(deps: UserRouteDependencies) {
  return {
    PATCH: async (request: Request, userIdValue: string) => {
      const id = requestId(request);
      try {
        const actor = await deps.resolveActor(request);
        if (!actor) throw Object.assign(new Error("Authentication required"), { status: 401 });
        validateMutationRequest(request);
        const input = updateUserRequestSchema.parse(await request.json());
        const userId = idSchema.parse(userIdValue);
        return Response.json(
          userSchema.parse(
            await deps.update({
              ...input,
              userId,
              actor,
              effectiveIdentity: `user:${actor.userId}`,
              requestId: id,
              correlationId: correlationId(request),
            }),
          ),
        );
      } catch (error) {
        return routeErrorResponse(error, id);
      }
    },
  };
}
