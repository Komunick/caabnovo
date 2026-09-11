import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { changeUserAccess } from "@/modules/users/user-access-service";
import { createUserAccessRoute } from "@/modules/users/http/user-access-route";
const route = createUserAccessRoute({
  resolveActor: resolveRequestActor,
  change: (command) => changeUserAccess(getDatabase().pool, command),
});
export async function PUT(request: Request, context: { params: Promise<{ userId: string }> }) {
  return route(request, (await context.params).userId);
}
