import { Client } from "pg";
import { provisionTestUser } from "../support/provision-user";

export async function provisionAccount(input: { email: string; name: string; password: string }) {
  const url =
    process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab";
  const db = new Client({ connectionString: url });
  await db.connect();
  try {
    return await provisionTestUser(db, input);
  } finally {
    await db.end();
  }
}
