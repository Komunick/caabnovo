import { roleSchema, type Role } from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import { requestId, routeErrorResponse } from "./responses";

interface RolesRouteDependencies {
  resolveActor(request: Request): Promise<RequestActor | null>;
  list(): Promise<Role[]>;
}

export function createRolesRoute(deps: RolesRouteDependencies) {
  return {
    GET: async (request: Request) => {
      const id = requestId(request);
      try {
        requirePermission((await deps.resolveActor(request)) ?? undefined, PERMISSIONS.rolesRead);
        return Response.json(roleSchema.array().parse(await deps.list()));
      } catch (error) {
        return routeErrorResponse(error, id);
      }
    },
  };
}
