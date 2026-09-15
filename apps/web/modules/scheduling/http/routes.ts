import type { Pool } from "pg";
import { apiError, idSchema, schedulingKindSchema } from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { readJson } from "../../members/http/routes";
import {
  correlationId,
  requestId,
  routeErrorResponse,
  validateMutationRequest,
} from "../../users/http/responses";
import { SchedulingError } from "../access";
import { listSchedulingCatalog, saveSchedulingCatalog } from "../catalog-service";
import { getSchedulingHours, saveSchedulingHours } from "../hours-service";
import { getSchedulingAvailability } from "../availability-service";
import { listSchedulingBeneficiaries } from "../beneficiary-service";
import {
  listSchedulingBookings,
  getSchedulingBooking,
  createSchedulingBooking,
  rescheduleSchedulingBooking,
  cancelSchedulingBooking,
} from "../booking-service";

export function createSchedulingRoute(deps: {
  pool: Pool;
  resolveActor(request: Request): Promise<RequestActor | null>;
}) {
  return async (request: Request, path: string[] = []): Promise<Response> => {
    const rid = requestId(request);
    let response: Response;
    try {
      const actor = await deps.resolveActor(request);
      if (!actor) throw new SchedulingError("AUTHENTICATION_REQUIRED", 401);
      const [resource, rawId, action] = path;
      if (path.length > 3 || !resource) throw new SchedulingError("NOT_FOUND", 404);
      const id = rawId ? idSchema.parse(rawId) : undefined;
      const query: Record<string, string> = {};
      const seen = new Set<string>();
      for (const [key, value] of new URL(request.url).searchParams) {
        if (seen.has(key)) throw new SchedulingError("VALIDATION_FAILED", 422);
        seen.add(key);
        if (value !== "") query[key] = value;
      }
      const kind = schedulingKindSchema.safeParse(resource);
      if (request.method === "GET") {
        let result: unknown;
        if (resource === "bookings" && !action)
          result = id
            ? await getSchedulingBooking(deps.pool, actor, id, query)
            : await listSchedulingBookings(deps.pool, actor, query);
        else if (resource === "beneficiaries" && path.length === 1)
          result = await listSchedulingBeneficiaries(deps.pool, actor, query);
        else if (resource === "availability" && path.length === 1)
          result = await getSchedulingAvailability(deps.pool, actor, query);
        else if ((resource === "units" || resource === "professionals") && id && action === "hours")
          result = await getSchedulingHours(deps.pool, actor, resource, id, query.unitId);
        else if (kind.success && path.length === 1)
          result = await listSchedulingCatalog(deps.pool, actor, kind.data, query);
        else throw new SchedulingError("NOT_FOUND", 404);
        response = Response.json(result);
      } else {
        const { idempotencyKey } = validateMutationRequest(request, {
          idempotency: request.method !== "PUT",
        });
        const context = {
          actor,
          requestId: rid,
          correlationId: correlationId(request),
          idempotencyKey: idempotencyKey ?? "",
        };
        const body = await readJson(request);
        if (
          request.method === "PUT" &&
          (resource === "units" || resource === "professionals") &&
          id &&
          action === "hours"
        ) {
          response = Response.json(
            await saveSchedulingHours(deps.pool, context, resource, id, body),
          );
        } else if (resource === "bookings" && request.method === "POST") {
          const result = !id
            ? await createSchedulingBooking(deps.pool, context, body)
            : action === "reschedule"
              ? await rescheduleSchedulingBooking(deps.pool, context, id, body)
              : action === "cancel"
                ? await cancelSchedulingBooking(deps.pool, context, id, body)
                : null;
          if (!result) throw new SchedulingError("NOT_FOUND", 404);
          response = Response.json(result.value, { status: !id && !result.replayed ? 201 : 200 });
        } else if (
          kind.success &&
          !action &&
          ((request.method === "POST" && !id) || (request.method === "PATCH" && id))
        ) {
          const result = await saveSchedulingCatalog(deps.pool, context, kind.data, id, body);
          response = Response.json(result.value, { status: !id && !result.replayed ? 201 : 200 });
        } else throw new SchedulingError("NOT_FOUND", 404);
      }
    } catch (error) {
      response =
        typeof error === "object" && error && "status" in error && error.status === 413
          ? Response.json(apiError("BODY_TOO_LARGE", "Corpo excede o limite permitido", rid), {
              status: 413,
            })
          : routeErrorResponse(error, rid);
    }
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Request-Id", rid);
    return response;
  };
}
