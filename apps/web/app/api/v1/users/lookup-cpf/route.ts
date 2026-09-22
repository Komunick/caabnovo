import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { lookupUserCpf } from "@/modules/users/user-service";
import { createUserCpfLookupRoute } from "@/modules/users/http/user-cpf-lookup-route";
export const POST = createUserCpfLookupRoute({
  resolveActor: resolveRequestActor,
  lookup: (actor, input) => lookupUserCpf(getDatabase().pool, actor, input),
});
