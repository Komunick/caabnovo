import "server-only";
import Cursor from "pg-cursor";
import { createDatabaseClient } from "@caab/db";
import { loadServerEnv } from "@caab/config";
import type { Pool, PoolClient } from "pg";
import type { ExportRequest } from "@caab/contracts";
import type { ExportAdapter } from "./catalog";

let pools: { data: Pool; control: Pool } | undefined;
export function getExportPools() {
  if (!pools) {
    const url = loadServerEnv().DATABASE_URL;
    // Four export connections in addition to the shared web pool's ten.
    pools = {
      data: createDatabaseClient(url, { max: 2, connectionTimeoutMillis: 5000 }).pool,
      control: createDatabaseClient(url, { max: 2, connectionTimeoutMillis: 5000 }).pool,
    };
  }
  return pools;
}
/** An aborted queued acquisition still releases its eventual connection. */
export async function acquire(pool: Pool, signal: AbortSignal): Promise<PoolClient> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason ?? new Error("EXPORT_CANCELLED"));
    signal.addEventListener("abort", abort, { once: true });
    void pool.connect().then(
      (client) => {
        signal.removeEventListener("abort", abort);
        if (signal.aborted) {
          client.release();
          return;
        }
        resolve(client);
      },
      (error) => {
        signal.removeEventListener("abort", abort);
        reject(error);
      },
    );
  });
}
export async function* exportBatches(
  pool: Pool,
  adapter: ExportAdapter,
  input: ExportRequest,
  signal: AbortSignal,
  batchSize = 100,
) {
  const client = await acquire(pool, signal);
  let released = false;
  const abort = () => {
    if (!released) {
      released = true;
      client.release(true);
    }
  };
  signal.addEventListener("abort", abort, { once: true });
  let cursor: Cursor<Record<string, unknown>> | undefined;
  try {
    signal.throwIfAborted();
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await client.query("SET LOCAL statement_timeout='30s'");
    const query = adapter.query(input);
    cursor = client.query(new Cursor<Record<string, unknown>>(query.text, query.values));
    for (;;) {
      signal.throwIfAborted();
      const batch = await cursor.read(batchSize);
      if (!batch.length) break;
      yield batch.map((row) => adapter.map(row));
    }
    await cursor.close();
    cursor = undefined;
    await client.query("COMMIT");
  } finally {
    signal.removeEventListener("abort", abort);
    if (!released) {
      try {
        await cursor?.close();
        await client.query("ROLLBACK");
      } finally {
        released = true;
        client.release();
      }
    }
  }
}
