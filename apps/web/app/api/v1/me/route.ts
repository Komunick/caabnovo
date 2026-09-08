import { createCurrentUserRoute, resolveCurrentUser } from "@/modules/auth/current-user";

export const GET = createCurrentUserRoute(resolveCurrentUser);
