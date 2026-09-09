import { loadServerEnv, loadWorkspaceEnv } from "@caab/config";
import { logger } from "./logger.js";
import { createQueue, startQueue } from "./queue.js";
import { QUEUES } from "./queues.js";
import { createDatabaseClient } from "@caab/db";
import { S3Client } from "@aws-sdk/client-s3";
import { executeTrackedJob } from "./job-runtime.js";
import { runAuditExport } from "./jobs/audit-export.js";
import { startWorkerHealth } from "./health.js";
import { S3WorkerObjectStorage } from "./object-storage.js";
import { ClamAvScanner } from "./clamav.js";
import { runFileScan } from "./jobs/scan-file.js";
import { promoteFile, purgeRejectedFile } from "./jobs/promote-file.js";
import { reconcileFiles } from "./jobs/reconcile-files.js";
import { startQueueMetrics } from "./metrics.js";
import { runScheduledNews, closeScheduledNews } from "./jobs/publish-news.js";
import { newsActionJobPayloadSchema } from "@caab/contracts";

loadWorkspaceEnv();
const env = loadServerEnv();
const boss = await startQueue(createQueue(env.DATABASE_URL));
const database = createDatabaseClient(env.DATABASE_URL);
const workerId = `worker-${process.pid}-${crypto.randomUUID()}`;
const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: true,
  credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
});
const fileStorage = new S3WorkerObjectStorage(s3, env.S3_QUARANTINE_BUCKET, env.S3_PRIVATE_BUCKET);
const antivirus = new ClamAvScanner(env.CLAMAV_HOST, env.CLAMAV_PORT);

await boss.work(QUEUES.newsPublication, async (jobs) => {
  const data = jobs[0]?.data;
  if (!data) return;
  const payload = newsActionJobPayloadSchema.parse(data);
  await executeTrackedJob(
    database.pool,
    {
      id: payload.jobId,
      correlationId: payload.correlationId,
      requestId: payload.requestId,
      jobType: QUEUES.newsPublication,
    },
    async () => {
      await runScheduledNews(payload);
    },
  );
});

await boss.work(QUEUES.auditExport, async (jobs) => {
  const job = jobs[0];
  if (!job) return;
  const payload = job.data as import("@caab/contracts").AuditExportJobPayload;
  await executeTrackedJob(
    database.pool,
    {
      id: payload.jobId,
      correlationId: payload.correlationId,
      requestId: payload.requestId,
      jobType: QUEUES.auditExport,
    },
    async ({ progress }) => {
      await progress(10);
      await runAuditExport(database.pool, s3, env.S3_PRIVATE_BUCKET, payload);
      await progress(95);
    },
  );
});

await boss.work(QUEUES.fileScan, async (jobs) => {
  const job = jobs[0];
  if (!job) return;
  const payload = job.data as import("@caab/contracts").FileScanJobPayload;
  await executeTrackedJob(
    database.pool,
    {
      id: payload.jobId,
      correlationId: payload.correlationId,
      requestId: payload.requestId,
      jobType: QUEUES.fileScan,
    },
    async ({ progress }) => {
      await progress(10);
      const inspection = await runFileScan(database.pool, fileStorage, antivirus, payload);
      await progress(70);
      if (inspection.disposition === "promote") {
        await promoteFile(database.pool, fileStorage, payload.fileId);
      } else if (inspection.disposition === "reject") {
        await purgeRejectedFile(database.pool, fileStorage, payload.fileId);
      }
      await progress(95);
    },
  );
});

await boss.work(QUEUES.filePromotion, async (jobs) => {
  const payload = jobs[0]?.data as { fileId?: string } | undefined;
  if (payload?.fileId) await promoteFile(database.pool, fileStorage, payload.fileId);
});

await boss.work(QUEUES.fileReconciliation, async () => {
  const summary = await reconcileFiles(database.pool, fileStorage);
  logger.info({ event: "files.reconciled", ...summary }, "Files reconciled");
});
await boss.schedule(QUEUES.fileReconciliation, "*/5 * * * *", {});

const stopQueueMetrics = startQueueMetrics(boss, Object.values(QUEUES));

const health = await startWorkerHealth(database.pool, workerId, Object.values(QUEUES));

logger.info({ event: "worker.started", outcome: "success" }, "Worker started");

async function shutdown(): Promise<void> {
  logger.info({ event: "worker.stopping" }, "Worker stopping");
  stopQueueMetrics();
  await health.stop();
  await boss.stop({ graceful: true, timeout: 30_000 });
  await closeScheduledNews();
  await database.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
