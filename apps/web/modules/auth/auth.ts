import "server-only";
import { loadServerEnv } from "@caab/config";
import { getDatabase } from "../shared/database";
import { createAuth } from "./auth-factory";
import { checkAccountMailAvailable, sendPasswordResetEmail } from "./account-mail";

export { createAuth, type CreateAuthOptions } from "./auth-factory";

let singleton: ReturnType<typeof createAuth> | undefined;

export function getAuth(): ReturnType<typeof createAuth> {
  if (!singleton) {
    const env = loadServerEnv();
    const database = getDatabase();
    singleton = createAuth({
      database: database.db,
      pool: database.pool,
      baseURL: env.BETTER_AUTH_URL,
      secret: env.BETTER_AUTH_SECRET,
      disableRateLimit: process.env.E2E_TEST_MODE === "1",
      sendResetPassword: ({ user, token }) => sendPasswordResetEmail(user.email, token),
      checkMailAvailable: checkAccountMailAvailable,
    });
  }
  return singleton;
}
