import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { initializeUserPassword } from "@/modules/users/initial-password-service";
import { createInitialPasswordRoute } from "@/modules/users/http/initial-password-route";

const route = createInitialPasswordRoute({
  resolveActor: resolveRequestActor,
  initialize: (command) => initializeUserPassword(getDatabase().pool, command),
});

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  return route(request, (await params).userId);
}
