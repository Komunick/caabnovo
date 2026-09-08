import "server-only";
import type { RequestActor } from "../shared/request-context";
import { getDatabase } from "../shared/database";
import { getAuth } from "./auth";
import { loadActiveSession } from "./session-dal";

export async function resolveRequestActor(request: Request): Promise<RequestActor | null> {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return null;
  return loadActiveSession(getDatabase().pool, session.session.token);
}
