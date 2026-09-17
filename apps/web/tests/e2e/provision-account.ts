import { Client } from "pg";
import { assertLocalSeedTarget } from "../support/local-seed-target";
import { provisionTestUser } from "../support/provision-user";

export async function provisionAccount(input: { email: string; name: string; password: string }) {
  const url =
    process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab";
  assertLocalSeedTarget({
    ...process.env,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    DATABASE_ADMIN_URL: url,
  });
  const db = new Client({ connectionString: url });
  await db.connect();
  try {
    return await provisionTestUser(db, input);
  } finally {
    await db.end();
  }
}
