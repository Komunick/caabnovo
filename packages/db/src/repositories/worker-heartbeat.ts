import type { Pool, PoolClient } from "pg";

type Queryable = Pick<Pool | PoolClient, "query">;

export async function upsertWorkerHeartbeat(
  db: Queryable,
  heartbeat: {
    instanceId: string;
    queues: string[];
    status: "starting" | "ready" | "degraded" | "stopping";
  },
): Promise<void> {
  await db.query(
    `INSERT INTO worker_heartbeat
      (instance_id, started_at, last_heartbeat_at, queues, status)
     VALUES ($1, now(), now(), $2, $3)
     ON CONFLICT (instance_id) DO UPDATE SET
       last_heartbeat_at = now(), queues = EXCLUDED.queues, status = EXCLUDED.status`,
    [heartbeat.instanceId, heartbeat.queues, heartbeat.status],
  );
}

export async function isWorkerReady(db: Queryable, maximumAgeMs: number): Promise<boolean> {
  const result = await db.query<{ ready: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM worker_heartbeat
       WHERE status = 'ready'
         AND last_heartbeat_at >= now() - ($1::double precision * interval '1 millisecond')
     ) AS ready`,
    [maximumAgeMs],
  );
  return result.rows[0]?.ready ?? false;
}
