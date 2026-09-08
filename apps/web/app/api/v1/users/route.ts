import { listUsers } from "@caab/db/repositories/users";
import { createUsersRoute } from "@/modules/users/http/users-route";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { createUser, serializeUser } from "@/modules/users/user-service";

const route = createUsersRoute({
  resolveActor: resolveRequestActor,
  list: async (query) => {
    const page = await listUsers(getDatabase().pool, query);
    return { items: page.items.map(serializeUser), nextCursor: page.nextCursor };
  },
  create: (command) => createUser(getDatabase().pool, command),
});

export const GET = route.GET;
export const POST = route.POST;
