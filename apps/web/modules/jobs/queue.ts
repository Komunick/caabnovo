import "server-only";
import { PgBoss } from "pg-boss";
import { loadServerEnv } from "@caab/config";

export const AUDIT_EXPORT_QUEUE = "audit-export";
export const FILE_SCAN_QUEUE = "file-scan";

let queuePromise: Promise<PgBoss> | undefined;

export function getJobQueue(): Promise<PgBoss> {
  if (!queuePromise) {
    queuePromise = (async () => {
      const boss = new PgBoss({
        connectionString: loadServerEnv().DATABASE_URL,
        schema: "pgboss",
        application_name: "caab-web-enqueue",
        migrate: false,
        createSchema: false,
        supervise: false,
        useListenNotify: false,
      });
      await boss.start();
      for (const name of [AUDIT_EXPORT_QUEUE, FILE_SCAN_QUEUE]) {
        await boss.createQueue(name, {
          policy: "standard",
          retryLimit: 4,
          retryDelay: 30,
          retryBackoff: true,
          retryDelayMax: 900,
          expireInSeconds: 900,
          retentionSeconds: 1_209_600,
          deleteAfterSeconds: 604_800,
        });
      }
      return boss;
    })().catch((error) => {
      queuePromise = undefined;
      throw error;
    });
  }
  return queuePromise;
}
