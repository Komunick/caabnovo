import { createOabRoute } from "@/modules/members/http/oab-route";
import { queryOab } from "@/modules/members/oab-service";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";

export const runtime = "nodejs";
export const POST = createOabRoute({
  resolveActor: resolveRequestActor,
  query: (context, input) => queryOab(getDatabase().pool, context, input),
});
