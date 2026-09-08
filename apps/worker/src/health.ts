import type { Pool } from "pg";
import { upsertWorkerHeartbeat } from "@caab/db/repositories/worker-heartbeat";

export interface WorkerHealth {
  stop(): Promise<void>;
}

export async function startWorkerHealth(
  pool: Pool,
  instanceId: string,
  queues: string[],
  intervalMs = 10_000,
): Promise<WorkerHealth> {
  await upsertWorkerHeartbeat(pool, { instanceId, queues, status: "ready" });
  const timer = setInterval(() => {
    void upsertWorkerHeartbeat(pool, { instanceId, queues, status: "ready" });
  }, intervalMs);
  timer.unref();

  return {
    stop: async () => {
      clearInterval(timer);
      await upsertWorkerHeartbeat(pool, { instanceId, queues, status: "stopping" });
    },
  };
}
