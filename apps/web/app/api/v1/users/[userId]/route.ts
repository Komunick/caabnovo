import { createUserRoute } from "@/modules/users/http/user-route";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { changeUser } from "@/modules/users/user-service";

const route = createUserRoute({
  resolveActor: resolveRequestActor,
  update: (command) => changeUser(getDatabase().pool, command),
});

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  return route.PATCH(request, (await context.params).userId);
}
