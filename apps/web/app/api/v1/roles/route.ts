import { listActiveRoles } from "@caab/db/repositories/roles";
import { roleSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { createRolesRoute } from "@/modules/users/http/roles-route";

const route = createRolesRoute({
  resolveActor: resolveRequestActor,
  list: async () =>
    (await listActiveRoles(getDatabase().pool)).map((role) =>
      roleSchema.parse({
        id: role.id,
        code: role.code,
        name: role.name,
        administrative: role.administrative,
        permissions: role.permissions,
      }),
    ),
});

export const GET = route.GET;
