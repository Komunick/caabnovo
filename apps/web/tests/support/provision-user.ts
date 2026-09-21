import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { createLocalAccountIssuer } from "better-auth/db";
import type { Client, Pool } from "pg";

// Test-only SQL provisioning. Production has no flag or endpoint to reopen signup.
export async function provisionTestUser(
  db: Client | Pool,
  input: { email: string; name: string; password: string; permissions?: string[] },
) {
  const id = randomUUID();
  const hash = await hashPassword(input.password);
  await db.query('INSERT INTO "user"(id,name,email) VALUES ($1,$2,$3)', [
    id,
    input.name,
    input.email,
  ]);
  await db.query(
    "INSERT INTO account(id,account_id,provider_id,user_id,password,issuer) VALUES ($1,$2,'credential',$3,$4,$5)",
    [randomUUID(), id, id, hash, createLocalAccountIssuer("credential")],
  );
  if (input.permissions)
    await db.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES ($1,$2,$1)", [
      id,
      input.permissions,
    ]);
  return { id, email: input.email, name: input.name };
}
