import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { resetUserPassword } from "@/modules/users/initial-password-service";
import { createResetPasswordRoute } from "@/modules/users/http/reset-password-route";
const route = createResetPasswordRoute({
  resolveActor: resolveRequestActor,
  reset: (command) => resetUserPassword(getDatabase().pool, command),
});
export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  return route(request, (await params).userId);
}
