import { loadServerEnv } from "@caab/config";
import { getDatabase } from "@/modules/shared/database";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { createCollectionRoute } from "@/modules/reports/ingest";
export async function POST(request: Request) {
  return createCollectionRoute({
    pool: getDatabase().pool,
    resolveActor: resolveRequestActor,
    secret: loadServerEnv().BETTER_AUTH_SECRET,
  })(request);
}
