import "server-only";
import type { Pool } from "pg";
import { withTransaction } from "@caab/db";
import { writeSecurityEvent, type SecurityEventInput } from "@caab/db/repositories/security-events";

export async function recordSecurityEvent(pool: Pool, event: SecurityEventInput): Promise<string> {
  return withTransaction(pool, (client) => writeSecurityEvent(client, event));
}
