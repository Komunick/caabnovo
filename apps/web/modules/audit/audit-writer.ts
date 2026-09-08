import "server-only";
import type { Pool } from "pg";
import { withTransaction } from "@caab/db";
import { writeAuditEvent, type AuditEventInput } from "@caab/db/repositories/audit-writer";

export async function inAuditedTransaction<T>(
  pool: Pool,
  mutation: (client: import("pg").PoolClient) => Promise<{ result: T; audit: AuditEventInput }>,
): Promise<T> {
  return withTransaction(pool, async (client) => {
    const { result, audit } = await mutation(client);
    await writeAuditEvent(client, audit);
    return result;
  });
}
