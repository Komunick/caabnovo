import "server-only";
import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { withTransaction } from "@caab/db";
import { lockMemberEligibility } from "@caab/db/repositories/members";
import type { RequestActor } from "../shared/request-context";

export class SchedulingError extends Error {
  constructor(
    readonly code: string,
    readonly status = 409,
  ) {
    super(code);
  }
}
export type SchedulingContext = {
  actor: RequestActor;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
};
export async function schedulingAccess<T>(
  pool: Pool,
  actor: RequestActor,
  write: boolean,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  try {
    return await withTransaction(pool, async (client) => {
      const session = await client.query(
        `SELECT u.id FROM "user" u JOIN session s ON s.user_id=u.id
        WHERE u.id=$1 AND s.id=$2 AND u.status='active' AND s.revoked_at IS NULL AND s.expires_at>clock_timestamp() FOR SHARE OF u,s`,
        [actor.userId, actor.sessionId],
      );
      if (!session.rowCount) throw new SchedulingError("AUTHENTICATION_REQUIRED", 401);
      if (write) await lockMemberEligibility(client);
      // Revalidate after waiting for a contended write lock.
      const valid = await client.query(
        "SELECT id FROM session WHERE id=$1 AND expires_at>clock_timestamp() AND revoked_at IS NULL",
        [actor.sessionId],
      );
      if (!valid.rowCount) throw new SchedulingError("AUTHENTICATION_REQUIRED", 401);
      return operation(client);
    });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? error.code : undefined;
    if (code === "23P01") throw new SchedulingError("SCHEDULING_CONFLICT");
    if (code === "23505") throw new SchedulingError("SCHEDULING_DUPLICATE");
    if (code === "23503" || code === "23514")
      throw new SchedulingError("SCHEDULING_INVALID_REFERENCE", 422);
    throw error;
  }
}
export async function schedulingReplay<T>(
  client: PoolClient,
  context: SchedulingContext,
  operation: string,
  input: unknown,
  work: () => Promise<T>,
): Promise<{ value: T; replayed: boolean }> {
  if (context.idempotencyKey.length < 16 || context.idempotencyKey.length > 128)
    throw new SchedulingError("IDEMPOTENCY_KEY_REQUIRED", 422);
  const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const prior = (
    await client.query<{ payload_hash: string; result: T }>(
      "SELECT payload_hash,result FROM scheduling_request WHERE actor_id=$1 AND operation=$2 AND key=$3",
      [context.actor.userId, operation, context.idempotencyKey],
    )
  ).rows[0];
  if (prior) {
    if (prior.payload_hash !== hash) throw new SchedulingError("IDEMPOTENCY_CONFLICT");
    return { value: prior.result, replayed: true };
  }
  const value = await work();
  await client.query(
    "INSERT INTO scheduling_request(actor_id,operation,key,payload_hash,result) VALUES($1,$2,$3,$4,$5)",
    [context.actor.userId, operation, context.idempotencyKey, hash, JSON.stringify(value)],
  );
  return { value, replayed: false };
}
