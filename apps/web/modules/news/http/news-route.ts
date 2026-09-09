import {
  apiError,
  createNewsDraftRequestSchema,
  idSchema,
  newsListQuerySchema,
  newsVersionCommandSchema,
  restoreNewsRevisionRequestSchema,
  updateNewsDraftRequestSchema,
  publishNewsRequestSchema,
  scheduleNewsRequestSchema,
} from "@caab/contracts";
import { AuthenticationRequiredError } from "../../auth/authorize";
import type { RequestActor } from "../../shared/request-context";
import {
  correlationId,
  requestId,
  routeErrorResponse,
  validateMutationRequest,
} from "../../users/http/responses";
import type {
  NewsCommandContext,
  NewsRecord,
  listNewsDrafts,
  listNewsVersions,
} from "../news-service";
import type { listNewsMedia } from "../media-service";
import { NewsPolicyError } from "../errors";

interface NewsRouteDependencies {
  resolveActor(request: Request): Promise<RequestActor | null>;
  service: {
    publication(actor: RequestActor, id: string): Promise<unknown>;
    publish(context: NewsCommandContext, id: string, input: unknown): Promise<NewsRecord>;
    unpublish(context: NewsCommandContext, id: string, input: unknown): Promise<NewsRecord>;
    schedule(context: NewsCommandContext, id: string, input: unknown): Promise<unknown>;
    cancel(context: NewsCommandContext, id: string, actionId: string): Promise<unknown>;
    retry(context: NewsCommandContext, id: string, actionId: string): Promise<unknown>;
    create(context: NewsCommandContext, input: unknown): Promise<NewsRecord>;
    get(actor: RequestActor, id: string): Promise<NewsRecord>;
    list(actor: RequestActor, query: unknown): ReturnType<typeof listNewsDrafts>;
    update(context: NewsCommandContext, id: string, input: unknown): Promise<NewsRecord>;
    duplicate(context: NewsCommandContext, id: string, input: unknown): Promise<NewsRecord>;
    archive(context: NewsCommandContext, id: string, input: unknown): Promise<NewsRecord>;
    restore(context: NewsCommandContext, id: string, input: unknown): Promise<NewsRecord>;
    versions(actor: RequestActor, id: string, page: number): ReturnType<typeof listNewsVersions>;
    media(actor: RequestActor, id: string, page: number): ReturnType<typeof listNewsMedia>;
    mediaDownload(
      actor: RequestActor,
      id: string,
      fileId: string,
    ): Promise<{ url: string; expiresAt: string }>;
  };
}

class NewsBodyRequestError extends Error {
  constructor(
    readonly status: 413 | 422,
    readonly code: string,
  ) {
    super(code);
  }
}

async function readJson(request: Request): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json"
  ) {
    throw new NewsBodyRequestError(422, "JSON_REQUIRED");
  }
  const limit = 1_048_576;
  if (Number(request.headers.get("content-length")) > limit) {
    throw new NewsBodyRequestError(413, "BODY_TOO_LARGE");
  }
  if (!request.body) throw new NewsBodyRequestError(422, "JSON_REQUIRED");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new NewsBodyRequestError(413, "BODY_TOO_LARGE");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof NewsBodyRequestError) throw error;
    throw new NewsBodyRequestError(422, "INVALID_JSON");
  } finally {
    reader.releaseLock();
  }
}

export function createNewsRoutes(deps: NewsRouteDependencies) {
  async function respond(
    request: Request,
    operation: (context: NewsCommandContext & { actor: RequestActor }) => Promise<Response>,
  ) {
    const id = requestId(request);
    let response: Response;
    try {
      const actor = await deps.resolveActor(request);
      if (!actor) throw new AuthenticationRequiredError("Authentication required");
      response = await operation({ actor, requestId: id, correlationId: correlationId(request) });
    } catch (error) {
      response =
        error instanceof NewsBodyRequestError
          ? Response.json(
              apiError(
                error.code,
                error.status === 413 ? "Request body too large" : "Invalid JSON body",
                id,
              ),
              { status: error.status },
            )
          : error instanceof NewsPolicyError &&
              (error.issues.length > 0 || error.code === "NEWS_SLUG_CONFLICT")
            ? Response.json(
                {
                  ...apiError(error.code, "Confira os campos indicados.", id),
                  fields:
                    error.code === "NEWS_SLUG_CONFLICT"
                      ? [{ path: "metadata.slug", code: error.code }]
                      : error.issues.map(({ field, code }) => ({ path: field, code })),
                },
                { status: error.status },
              )
            : routeErrorResponse(error, id);
    }
    response.headers.set("cache-control", "private, no-store");
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }
  return {
    publication: (request: Request, id: string) =>
      respond(request, async ({ actor }) =>
        Response.json(await deps.service.publication(actor, idSchema.parse(id))),
      ),
    publish: (request: Request, id: string, action: "publish" | "unpublish" | "schedule") =>
      respond(request, async (context) => {
        const { idempotencyKey } = validateMutationRequest(request, { idempotency: true });
        const input = (
          action === "schedule" ? scheduleNewsRequestSchema : publishNewsRequestSchema
        ).parse(await readJson(request));
        return Response.json(
          await deps.service[action](
            { ...context, idempotencyKey: idempotencyKey! },
            idSchema.parse(id),
            input,
          ),
        );
      }),
    cancel: (
      request: Request,
      id: string,
      actionId: string,
      action: "cancel" | "retry" = "cancel",
    ) =>
      respond(request, async (context) => {
        validateMutationRequest(request);
        return Response.json(
          await deps.service[action](context, idSchema.parse(id), idSchema.parse(actionId)),
        );
      }),
    media: (request: Request, id: string) =>
      respond(request, async ({ actor }) => {
        const { page } = newsListQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        );
        return Response.json(await deps.service.media(actor, idSchema.parse(id), page));
      }),
    mediaDownload: (request: Request, id: string, fileId: string) =>
      respond(request, async ({ actor }) => {
        const grant = await deps.service.mediaDownload(
          actor,
          idSchema.parse(id),
          idSchema.parse(fileId),
        );
        return new Response(null, { status: 307, headers: { location: grant.url } });
      }),
    GET: (request: Request) =>
      respond(request, async ({ actor }) => {
        const query = newsListQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        );
        return Response.json(await deps.service.list(actor, query));
      }),
    POST: (request: Request) =>
      respond(request, async (context) => {
        const { idempotencyKey } = validateMutationRequest(request, { idempotency: true });
        const input = createNewsDraftRequestSchema.parse(await readJson(request));
        return Response.json(
          await deps.service.create({ ...context, idempotencyKey: idempotencyKey! }, input),
          { status: 201 },
        );
      }),
    get: (request: Request, id: string) =>
      respond(request, async ({ actor }) =>
        Response.json(await deps.service.get(actor, idSchema.parse(id))),
      ),
    PUT: (request: Request, id: string) =>
      respond(request, async (context) => {
        validateMutationRequest(request);
        const input = updateNewsDraftRequestSchema.parse(await readJson(request));
        return Response.json(await deps.service.update(context, idSchema.parse(id), input));
      }),
    versions: (request: Request, id: string) =>
      respond(request, async ({ actor }) => {
        const { page } = newsListQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        );
        return Response.json(await deps.service.versions(actor, idSchema.parse(id), page));
      }),
    command: (request: Request, id: string, action: "duplicate" | "archive" | "restore") =>
      respond(request, async (context) => {
        const { idempotencyKey } = validateMutationRequest(request, {
          idempotency: action === "duplicate",
        });
        const body = await readJson(request);
        const input =
          action === "restore"
            ? restoreNewsRevisionRequestSchema.parse(body)
            : newsVersionCommandSchema.parse(body);
        const result = await deps.service[action](
          { ...context, idempotencyKey: idempotencyKey ?? undefined },
          idSchema.parse(id),
          input,
        );
        return Response.json(result, { status: action === "duplicate" ? 201 : 200 });
      }),
  };
}
