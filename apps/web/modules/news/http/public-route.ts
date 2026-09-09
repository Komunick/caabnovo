import { requestId, routeErrorResponse } from "../../users/http/responses";
import type { listPublicNews, readPublicNews, getPublicNewsMedia } from "../public-service";

export function createPublicNewsRoutes(service: {
  list(channel: string, query: unknown): ReturnType<typeof listPublicNews>;
  get(channel: string, id: string): ReturnType<typeof readPublicNews>;
  media(channel: string, id: string, fileId: string): ReturnType<typeof getPublicNewsMedia>;
}) {
  async function respond(request: Request, operation: () => Promise<Response>) {
    let response: Response;
    try {
      response = await operation();
    } catch (error) {
      response = routeErrorResponse(error, requestId(request));
    }
    response.headers.set("cache-control", "no-store");
    response.headers.set("access-control-allow-origin", "*");
    response.headers.set("x-content-type-options", "nosniff");
    return response;
  }
  return {
    list: (request: Request, channel: string) =>
      respond(request, async () =>
        Response.json(
          await service.list(channel, Object.fromEntries(new URL(request.url).searchParams)),
        ),
      ),
    get: (request: Request, channel: string, id: string) =>
      respond(request, async () => Response.json(await service.get(channel, id))),
    media: (request: Request, channel: string, id: string, fileId: string) =>
      respond(
        request,
        async () =>
          new Response(null, {
            status: 307,
            headers: { location: (await service.media(channel, id, fileId)).url },
          }),
      ),
  };
}
