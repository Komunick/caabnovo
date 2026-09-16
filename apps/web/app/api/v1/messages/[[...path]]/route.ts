import { createMessagingRoute } from "@/modules/messaging/http/routes";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
export const runtime = "nodejs";
async function handle(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  return createMessagingRoute({ pool: getDatabase().pool, resolveActor: resolveRequestActor })(
    request,
    (await context.params).path,
  );
}
export { handle as GET, handle as POST, handle as PUT };
