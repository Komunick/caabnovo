import {
  apiError,
  createMemberSchema,
  idSchema,
  memberCommandSchema,
  memberListSchema,
} from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import {
  correlationId,
  requestId,
  routeErrorResponse,
  validateMutationRequest,
} from "../../users/http/responses";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import type { MemberContext } from "../member-service";

interface Dependencies {
  resolveActor(request: Request): Promise<RequestActor | null>;
  service: {
    list(actor: RequestActor, input: unknown): Promise<unknown>;
    get(actor: RequestActor, id: string): Promise<unknown>;
    create(context: MemberContext, input: unknown): Promise<unknown>;
    command(context: MemberContext, id: string, input: unknown): Promise<unknown>;
    history(actor: RequestActor, id: string, page: number): Promise<unknown>;
    files(actor: RequestActor, id: string, page: number): Promise<unknown>;
    download(actor: RequestActor, id: string, fileId: string): Promise<{ url: string }>;
  };
}
export async function readJson(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json" ||
    !request.body
  )
    throw { code: "JSON_REQUIRED", status: 422 };
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) {
        await reader.cancel();
        throw { code: "BODY_TOO_LARGE", status: 413 };
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } catch (error) {
    if (typeof error === "object" && error && "status" in error) throw error;
    throw { code: "INVALID_JSON", status: 422 };
  } finally {
    reader.releaseLock();
  }
}
export function createMemberRoute(deps: Dependencies) {
  return async (request: Request, path: string[] = []): Promise<Response> => {
    const rid = requestId(request);
    let response: Response;
    try {
      const actor = await deps.resolveActor(request);
      if (!actor) throw { code: "AUTHENTICATION_REQUIRED", status: 401 };
      requirePermission(actor, PERMISSIONS.membersRead);
      const id = path[0] ? idSchema.parse(path[0]) : undefined;
      if (request.method === "GET") {
        const query = Object.fromEntries(new URL(request.url).searchParams);
        for (const key of ["registrationStatus", "oabState", "administrativeStatus"])
          if (query[key] === "") delete query[key];
        const page = memberListSchema.parse(query).page;
        if (!id) response = Response.json(await deps.service.list(actor, query));
        else if (path.length === 1) response = Response.json(await deps.service.get(actor, id));
        else if (path.length === 2 && path[1] === "history")
          response = Response.json(await deps.service.history(actor, id, page));
        else if (path.length === 2 && path[1] === "files")
          response = Response.json(await deps.service.files(actor, id, page));
        else if (path.length === 3 && path[1] === "files")
          response = new Response(null, {
            status: 307,
            headers: {
              location: (await deps.service.download(actor, id, idSchema.parse(path[2]))).url,
            },
          });
        else throw { code: "NOT_FOUND", status: 404 };
      } else if (request.method === "POST") {
        const { idempotencyKey } = validateMutationRequest(request, { idempotency: true });
        const context = {
          actor,
          requestId: rid,
          correlationId: correlationId(request),
          idempotencyKey: idempotencyKey!,
        };
        if (!id) {
          requirePermission(actor, PERMISSIONS.membersWrite);
          response = Response.json(
            await deps.service.create(context, createMemberSchema.parse(await readJson(request))),
            { status: 201 },
          );
        } else if (path.length === 2 && path[1] === "commands") {
          const input = memberCommandSchema.parse(await readJson(request));
          requirePermission(
            actor,
            ["assess", "review", "activate", "block", "unblock"].includes(input.action)
              ? PERMISSIONS.membersReview
              : PERMISSIONS.membersWrite,
          );
          response = Response.json(await deps.service.command(context, id, input));
        } else throw { code: "NOT_FOUND", status: 404 };
      } else response = new Response(null, { status: 405, headers: { allow: "GET, POST" } });
    } catch (error) {
      response =
        typeof error === "object" && error && "status" in error && error.status === 413
          ? Response.json(apiError("BODY_TOO_LARGE", "Request body too large", rid), {
              status: 413,
            })
          : routeErrorResponse(error, rid);
    }
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  };
}
