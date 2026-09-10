import { PgBoss } from "pg-boss";
import { queueDefinitions } from "./queues.js";
import { logger } from "./logger.js";

export function createQueue(connectionString: string): PgBoss {
  const boss = new PgBoss({
    connectionString,
    schema: "pgboss",
    application_name: "caab-worker",
    migrate: false,
    createSchema: false,
    supervise: true,
    useListenNotify: true,
  });
  // PgBoss retries polling failures. An unhandled EventEmitter error would kill the worker
  // before it can recover; never include the database error payload in application logs.
  boss.on("error", () => {
    logger.error(
      { event: "queue.error", errorCode: "QUEUE_ERROR", outcome: "failure" },
      "Queue operation failed",
    );
  });
  return boss;
}

export async function startQueue(boss: PgBoss): Promise<PgBoss> {
  await boss.start();
  for (const definition of queueDefinitions) {
    const { name, ...options } = definition;
    await boss.createQueue(name, options);
  }
  return boss;
}
