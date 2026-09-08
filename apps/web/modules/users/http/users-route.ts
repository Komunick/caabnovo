import {
  createUserRequestSchema,
  userListQuerySchema,
  userPageSchema,
  userSchema,
  type CreateUserRequest,
  type User,
  type UserListQuery,
  type UserPage,
} from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import { correlationId, requestId, routeErrorResponse, validateMutationRequest } from "./responses";

interface UsersRouteDependencies {
  resolveActor(request: Request): Promise<RequestActor | null>;
  list(query: UserListQuery): Promise<UserPage>;
  create(
    command: CreateUserRequest & {
      actor: RequestActor;
      effectiveIdentity: string;
      requestId: string;
      correlationId: string;
      idempotencyKey: string;
    },
  ): Promise<User>;
}

export function createUsersRoute(deps: UsersRouteDependencies) {
  return {
    GET: async (request: Request) => {
      const id = requestId(request);
      try {
        requirePermission((await deps.resolveActor(request)) ?? undefined, PERMISSIONS.usersRead);
        const url = new URL(request.url);
        const query = userListQuerySchema.parse(Object.fromEntries(url.searchParams));
        return Response.json(userPageSchema.parse(await deps.list(query)));
      } catch (error) {
        return routeErrorResponse(error, id);
      }
    },
    POST: async (request: Request) => {
      const id = requestId(request);
      try {
        const actor = requirePermission(
          (await deps.resolveActor(request)) ?? undefined,
          PERMISSIONS.usersCreate,
        );
        const { idempotencyKey } = validateMutationRequest(request, { idempotency: true });
        const input = createUserRequestSchema.parse(await request.json());
        const created = await deps.create({
          ...input,
          actor,
          effectiveIdentity: `user:${actor.userId}`,
          requestId: id,
          correlationId: correlationId(request),
          idempotencyKey: idempotencyKey!,
        });
        return Response.json(userSchema.parse(created), { status: 201 });
      } catch (error) {
        return routeErrorResponse(error, id);
      }
    },
  };
}
