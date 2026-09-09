import pg, { type PoolClient, type PoolConfig } from "pg";
import type { Payload } from "payload";
import type { PostgresAdapter } from "@payloadcms/db-postgres";

const startupConnections = new WeakMap<pg.Pool, PoolClient>();

class NewsPool extends pg.Pool {
  constructor(options: PoolConfig) {
    super(options);
    // Payload 3.88's connectWithReconnect retains its first client as a connection monitor.
    // Record that specific lease so shutdown can release it before awaiting pool.end().
    this.once("acquire", (client: PoolClient) => startupConnections.set(this, client));
  }
}

export const newsPg = { ...pg, Pool: NewsPool };

export async function closeNewsPayload(payload: Payload) {
  const pool = (payload.db as unknown as PostgresAdapter).pool;
  const startup = startupConnections.get(pool);
  if (startup) {
    startupConnections.delete(pool);
    startup.release(true);
  }
  await pool.end();
  await payload.destroy();
}
