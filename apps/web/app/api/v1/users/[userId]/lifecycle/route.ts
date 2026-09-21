import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { changeUserLifecycle } from "@/modules/users/user-service";
import { createUserLifecycleRoute } from "@/modules/users/http/user-lifecycle-route";
const route = createUserLifecycleRoute({
  resolveActor: resolveRequestActor,
  change: (command) => changeUserLifecycle(getDatabase().pool, command),
});
export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  return route(request, (await params).userId);
}
