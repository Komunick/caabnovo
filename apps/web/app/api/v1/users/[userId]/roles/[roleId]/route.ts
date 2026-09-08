import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { createUserRoleRoute } from "@/modules/users/http/user-role-route";
import { grantRole, revokeRole } from "@/modules/users/role-assignment-service";

const route = createUserRoleRoute({
  resolveActor: resolveRequestActor,
  grant: (command) => grantRole(getDatabase().pool, command),
  revoke: (command) => revokeRole(getDatabase().pool, command),
});

type Context = { params: Promise<{ userId: string; roleId: string }> };

export async function PUT(request: Request, context: Context) {
  const { userId, roleId } = await context.params;
  return route.PUT(request, userId, roleId);
}

export async function DELETE(request: Request, context: Context) {
  const { userId, roleId } = await context.params;
  return route.DELETE(request, userId, roleId);
}
