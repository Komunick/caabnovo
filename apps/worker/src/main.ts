import "dotenv/config";
import { loadServerEnv } from "@caab/config";
import { logger } from "./logger.js";
import { createQueue, startQueue } from "./queue.js";

const env = loadServerEnv();
const boss = await startQueue(createQueue(env.DATABASE_URL));

logger.info({ event: "worker.started", outcome: "success" }, "Worker started");

async function shutdown(): Promise<void> {
  logger.info({ event: "worker.stopping" }, "Worker stopping");
  await boss.stop({ graceful: true, timeout: 30_000 });
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
