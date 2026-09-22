import {
  userCpfLookupSchema,
  userCpfLookupResultSchema,
  type UserCpfLookupResult,
} from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import { requestId, routeErrorResponse, validateMutationRequest } from "./responses";

export function createUserCpfLookupRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  lookup(actor: RequestActor, input: { cpf: string }): Promise<UserCpfLookupResult>;
}) {
  return async (request: Request) => {
    const rid = requestId(request);
    try {
      const actor = requirePermission(
        (await deps.resolveActor(request)) ?? undefined,
        PERMISSIONS.usersCreate,
      );
      requirePermission(actor, PERMISSIONS.usersRead);
      validateMutationRequest(request);
      const input = userCpfLookupSchema.parse(await request.json().catch(() => null));
      return Response.json(userCpfLookupResultSchema.parse(await deps.lookup(actor, input)), {
        headers: { "cache-control": "private, no-store" },
      });
    } catch (error) {
      return routeErrorResponse(error, rid);
    }
  };
}
