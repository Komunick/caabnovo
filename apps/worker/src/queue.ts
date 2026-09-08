import { PgBoss } from "pg-boss";
import { queueDefinitions } from "./queues.js";

export function createQueue(connectionString: string): PgBoss {
  return new PgBoss({
    connectionString,
    schema: "pgboss",
    application_name: "caab-worker",
    migrate: false,
    createSchema: false,
    supervise: true,
    useListenNotify: true,
  });
}

export async function startQueue(boss: PgBoss): Promise<PgBoss> {
  await boss.start();
  for (const definition of queueDefinitions) {
    const { name, ...options } = definition;
    await boss.createQueue(name, options);
  }
  return boss;
}
