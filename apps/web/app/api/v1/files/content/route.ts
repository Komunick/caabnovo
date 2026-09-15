import { loadServerEnv } from "@caab/config";
import { createContentRoute } from "@/modules/files/http/content-route";
import { getDatabase } from "@/modules/shared/database";
import { observeHttpRequest } from "@/modules/shared/metrics";

export const runtime = "nodejs";
const handler = createContentRoute({
  pool: () => getDatabase().pool,
  secret: () => loadServerEnv().BETTER_AUTH_SECRET,
});
const observedHandler = (request: Request) =>
  observeHttpRequest(request, "/api/v1/files/content", () => handler(request));
export const PUT = observedHandler;
export const GET = observedHandler;
