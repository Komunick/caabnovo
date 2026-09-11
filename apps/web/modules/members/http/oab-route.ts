import { apiError, oabLookupInputSchema } from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import {
  requestId,
  correlationId,
  routeErrorResponse,
  validateMutationRequest,
} from "../../users/http/responses";
import type { queryOab } from "../oab-service";
import { OabError } from "../oab-errors";
import { readJson } from "./routes";

export function createOabRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  query(context: Parameters<typeof queryOab>[1], input: unknown): Promise<unknown>;
}) {
  return async (request: Request) => {
    const rid = requestId(request);
    let response: Response;
    try {
      const actor = await deps.resolveActor(request);
      if (!actor) throw { code: "AUTHENTICATION_REQUIRED", status: 401 };
      requirePermission(actor, PERMISSIONS.membersRead);
      if (request.method !== "POST")
        response = new Response(null, { status: 405, headers: { allow: "POST" } });
      else {
        validateMutationRequest(request);
        const input = oabLookupInputSchema.parse(await readJson(request));
        response = Response.json(
          await deps.query({ actor, requestId: rid, correlationId: correlationId(request) }, input),
        );
      }
    } catch (error) {
      if (error instanceof OabError) {
        response = Response.json(apiError(error.code, "OAB lookup could not be completed", rid), {
          status: error.status,
        });
        if (error.status === 429) response.headers.set("retry-after", "60");
      } else if (typeof error === "object" && error && "status" in error && error.status === 413) {
        response = Response.json(apiError("BODY_TOO_LARGE", "Request body too large", rid), {
          status: 413,
        });
      } else response = routeErrorResponse(error, rid);
    }
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  };
}
