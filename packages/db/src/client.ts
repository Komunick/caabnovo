import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig, type PoolClient } from "pg";

export type Database = NodePgDatabase;

export interface DatabaseClient {
  db: Database;
  pool: Pool;
  close(): Promise<void>;
}

export function createDatabaseClient(
  connectionString: string,
  options: PoolConfig = {},
): DatabaseClient {
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ...options,
  });

  return {
    db: drizzle(pool),
    pool,
    close: () => pool.end(),
  };
}

export async function withTransaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
