import type { Pool } from "pg";
import { z } from "zod";
import { getObjectStorage, type WebObjectStorage } from "../../files/object-storage";
import {
  getSchedulingAbsenceReview,
  getSchedulingAbsenceEvidenceDownload,
} from "../absence-evidence-service";
import { scheduleConfirmedBooking } from "../../reports/business-events";
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
import {
  recordSchedulingAbsence,
  getSchedulingAbsence,
  listSchedulingAbsences,
  submitSchedulingAbsenceAppeal,
  decideSchedulingAbsence,
} from "../absence-service";
import { listSchedulingCatalog, saveSchedulingCatalog } from "../catalog-service";
import { getSchedulingHours, saveSchedulingHours } from "../hours-service";
import { getSchedulingAvailability } from "../availability-service";
import { listSchedulingBeneficiaries } from "../beneficiary-service";
import { getSchedulingPolicy, saveSchedulingPolicy } from "../service-policy";
import { commandWorkflowBooking, type WorkflowAction } from "../booking-workflow";
import {
  listSchedulingApprovalQueue,
  getSchedulingTeam,
  saveSchedulingTeam,
  listSchedulingTeamCandidates,
} from "../approval-queue-service";
import {
  listSchedulingBookings,
  listSchedulingCalendar,
  getSchedulingBooking,
  createSchedulingBooking,
  rescheduleSchedulingBooking,
  cancelSchedulingBooking,
  keepSchedulingBooking,
} from "../booking-service";

export function createSchedulingRoute(deps: {
  pool: Pool;
  getStorage?: () => WebObjectStorage;
  resolveActor(request: Request): Promise<RequestActor | null>;
  afterResponse(task: () => Promise<void>): void;
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
        if (resource === "absences" && path.length === 1) {
          result = await listSchedulingAbsences(deps.pool, actor, query);
        } else if (resource === "absences" && id && action === "review") {
          z.object({}).strict().parse(query);
          result = await getSchedulingAbsenceReview(deps.pool, actor, id);
        } else if (resource === "absences" && id && action === "evidence") {
          const { fileId } = z.object({ fileId: idSchema }).strict().parse(query);
          result = await getSchedulingAbsenceEvidenceDownload(
            deps.pool,
            actor,
            id,
            fileId,
            (deps.getStorage ?? getObjectStorage)(),
          );
        } else if (resource === "absences" && id && !action)
          result = await getSchedulingAbsence(deps.pool, actor, id);
        else if (resource === "approval-queue" && path.length === 1)
          result = await listSchedulingApprovalQueue(deps.pool, actor, query);
        else if (resource === "team-candidates" && path.length === 1)
          result = await listSchedulingTeamCandidates(deps.pool, actor, query);
        else if (resource === "units" && id && action === "team")
          result = await getSchedulingTeam(deps.pool, actor, id);
        else if (resource === "services" && id && action === "policy")
          result = await getSchedulingPolicy(deps.pool, actor, id);
        else if (resource === "bookings" && !action)
          result = id
            ? await getSchedulingBooking(deps.pool, actor, id, query)
            : await listSchedulingBookings(deps.pool, actor, query);
        else if (resource === "calendar" && path.length === 1)
          result = await listSchedulingCalendar(deps.pool, actor, query);
        else if (resource === "beneficiaries" && path.length === 1)
          result = await listSchedulingBeneficiaries(deps.pool, actor, query);
        else if (resource === "availability" && path.length === 1)
          result = await getSchedulingAvailability(deps.pool, actor, query);
        else if (
          (resource === "units" || resource === "professionals" || resource === "services") &&
          id &&
          action === "hours"
        )
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
        if (resource === "bookings" && id && action === "absence" && request.method === "POST") {
          const result = await recordSchedulingAbsence(deps.pool, context, id, body);
          response = Response.json(result.value, { status: result.replayed ? 200 : 201 });
        } else if (
          resource === "absences" &&
          id &&
          request.method === "POST" &&
          (action === "appeal" || action === "decision")
        ) {
          const result =
            action === "appeal"
              ? await submitSchedulingAbsenceAppeal(deps.pool, context, id, body)
              : await decideSchedulingAbsence(deps.pool, context, id, body);
          response = Response.json(result.value);
        } else if (resource === "units" && id && action === "team" && request.method === "POST") {
          const result = await saveSchedulingTeam(deps.pool, context, id, body);
          response = Response.json(result.value);
        } else if (
          resource === "services" &&
          id &&
          action === "policy" &&
          request.method === "POST"
        ) {
          const result = await saveSchedulingPolicy(deps.pool, context, id, body);
          response = Response.json(result.value);
        } else if (
          request.method === "PUT" &&
          (resource === "units" || resource === "professionals" || resource === "services") &&
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
                : action === "keep"
                  ? await keepSchedulingBooking(deps.pool, context, id, body)
                  : action &&
                      [
                        "pending",
                        "approve",
                        "reject",
                        "withdraw",
                        "resume",
                        "provider-unavailability",
                      ].includes(action)
                    ? await commandWorkflowBooking(
                        deps.pool,
                        context,
                        id,
                        action as WorkflowAction,
                        body,
                      )
                    : null;
          if (!result) throw new SchedulingError("NOT_FOUND", 404);
          if (!id && result.value.status === "scheduled")
            scheduleConfirmedBooking(
              deps.afterResponse,
              deps.pool,
              request,
              result.value.id,
              actor.userId,
            );
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
