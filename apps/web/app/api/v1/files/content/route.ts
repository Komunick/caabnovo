import { loadServerEnv } from "@caab/config";
import { createContentRoute } from "@/modules/files/http/content-route";
import { getDatabase } from "@/modules/shared/database";

export const runtime = "nodejs";
const handler = createContentRoute({
  pool: () => getDatabase().pool,
  secret: () => loadServerEnv().BETTER_AUTH_SECRET,
});
export const PUT = handler;
export const GET = handler;
