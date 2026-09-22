import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { promoteRole } from "@/modules/users/role-assignment-service";
import { createPromoteRoleRoute } from "@/modules/users/http/promote-role-route";

const route = createPromoteRoleRoute({
  resolveActor: resolveRequestActor,
  promote: (command) => promoteRole(getDatabase().pool, command),
});
export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string; roleId: string }> },
) {
  const { userId, roleId } = await context.params;
  return route.POST(request, userId, roleId);
}
