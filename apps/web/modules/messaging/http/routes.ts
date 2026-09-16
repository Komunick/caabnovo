import type { Pool } from "pg";
import {
  idSchema,
  messageKindSchema,
  messagePreviewSchema,
  messageQuerySchema,
  messageScheduleQuerySchema,
} from "@caab/contracts";
import {
  commandMessage,
  getMessage,
  listMessages,
  listMessageSchedules,
  messageAudienceOptions,
  messageHistory,
  messagePeople,
  previewMessage,
  saveMessage,
  saveMessagePreference,
} from "@caab/db/repositories/messaging";
import type { RequestActor } from "../../shared/request-context";
import {
  correlationId,
  requestId,
  routeErrorResponse,
  validateMutationRequest,
} from "../../users/http/responses";
import { readJson } from "../../members/http/routes";
export function createMessagingRoute(deps: {
  pool: Pool;
  resolveActor(request: Request): Promise<RequestActor | null>;
}) {
  return async (request: Request, path: string[] = []) => {
    const rid = requestId(request);
    let response: Response;
    try {
      const actor = await deps.resolveActor(request);
      if (!actor) throw { code: "AUTHENTICATION_REQUIRED", status: 401 };
      if (!actor.permissions.has("messages:access"))
        throw { code: "PERMISSION_DENIED", status: 403 };
      const [resource, rawId, action] = path;
      if (path.length > 3) throw { code: "NOT_FOUND", status: 404 };
      const query: Record<string, string> = {};
      for (const [key, value] of new URL(request.url).searchParams) {
        if (key in query) throw { code: "VALIDATION_FAILED", status: 422 };
        query[key] = value;
      }
      const q =
        resource === "schedules"
          ? messageScheduleQuerySchema.parse(query)
          : messageQuerySchema.parse(query);
      const id = rawId ? idSchema.parse(rawId) : null;
      if (request.method === "GET") {
        if (!id && resource === "schedules")
          response = Response.json(await listMessageSchedules(deps.pool, actor, q));
        else if (!id && (resource === "categories" || resource === "cities"))
          response = Response.json(
            await messageAudienceOptions(
              deps.pool,
              actor,
              resource === "categories" ? "category" : "city",
              q,
            ),
          );
        else if (!id && (resource === "recipients" || resource === "preferences"))
          response = Response.json(
            await messagePeople(deps.pool, actor, q, resource === "preferences"),
          );
        else {
          const kind = messageKindSchema.parse(resource);
          if (action === "history" && id && kind === "campaigns")
            response = Response.json(await messageHistory(deps.pool, actor, id, q));
          else if (action) throw { code: "NOT_FOUND", status: 404 };
          else
            response = Response.json(
              id
                ? await getMessage(deps.pool, actor, kind, id)
                : await listMessages(deps.pool, actor, kind, q),
            );
        }
      } else {
        const { idempotencyKey } = validateMutationRequest(request, { idempotency: true });
        const input = await readJson(request, 8 * 1024 * 1024);
        const context = {
          actor,
          requestId: rid,
          correlationId: correlationId(request),
          idempotencyKey: idempotencyKey!,
        };
        if (resource === "preview" && !id && request.method === "POST")
          response = Response.json(
            await previewMessage(deps.pool, actor, messagePreviewSchema.parse(input).data),
          );
        else if (resource === "preferences" && id && !action && request.method === "PUT")
          response = Response.json(await saveMessagePreference(deps.pool, context, id, input));
        else {
          const kind = messageKindSchema.parse(resource);
          if (request.method === "POST" && id && action === "command")
            response = Response.json(await commandMessage(deps.pool, context, kind, id, input));
          else if (
            !action &&
            ((request.method === "POST" && !id) || (request.method === "PUT" && id))
          )
            response = Response.json(await saveMessage(deps.pool, context, kind, id, input));
          else throw { code: "METHOD_NOT_ALLOWED", status: 404 };
        }
      }
    } catch (error) {
      response =
        typeof error === "object" && error && "status" in error && error.status === 413
          ? Response.json({ error: { code: "BODY_TOO_LARGE" } }, { status: 413 })
          : routeErrorResponse(error, rid);
    }
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Request-Id", rid);
    return response;
  };
}
