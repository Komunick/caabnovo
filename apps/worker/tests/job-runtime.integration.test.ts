import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import {
  createJobExecution,
  findJobExecution,
  redriveJobExecution,
} from "@caab/db/repositories/job-execution";
import { isWorkerReady, upsertWorkerHeartbeat } from "@caab/db/repositories/worker-heartbeat";
import { startPostgres } from "./postgres-container";
import { executeTrackedJob } from "../src/job-runtime";

let container: StartedPostgreSqlContainer;
let database: ReturnType<typeof createDatabaseClient>;

beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  database = createDatabaseClient(container.getConnectionUri());
}, 120_000);

afterAll(async () => {
  await database?.close();
  await container?.stop();
});

describe.sequential("tracked job runtime", () => {
  it("collapses concurrent equivalent job creation to one execution", async () => {
    const key = crypto.randomUUID();
    const correlationId = crypto.randomUUID();
    const jobs = await Promise.all(
      Array.from({ length: 6 }, () =>
        createJobExecution(database.pool, {
          id: crypto.randomUUID(),
          jobType: "synthetic-job",
          queueName: "synthetic-job",
          idempotencyKey: key,
          correlationId,
          attemptLimit: 3,
        }),
      ),
    );
    expect(new Set(jobs.map(({ id }) => id))).toHaveLength(1);
    expect(jobs.filter(({ created }) => created)).toHaveLength(1);
  });

  it("records safe failure, redrive, retry attempt, progress and terminal success", async () => {
    const id = crypto.randomUUID();
    const correlationId = crypto.randomUUID();
    await createJobExecution(database.pool, {
      id,
      jobType: "retry-job",
      queueName: "retry-job",
      idempotencyKey: crypto.randomUUID(),
      correlationId,
      attemptLimit: 3,
    });
    await expect(
      executeTrackedJob(database.pool, { id, correlationId }, async ({ progress }) => {
        await progress(40);
        throw new Error("password=synthetic stack=internal.ts:42");
      }),
    ).rejects.toThrow();
    expect(await findJobExecution(database.pool, id)).toMatchObject({
      status: "failed",
      progress: 40,
      attemptCount: 1,
      safeErrorCode: "JOB_FAILED",
      safeErrorMessage: "The operation could not be completed",
    });

    expect(await redriveJobExecution(database.pool, id)).toBe(true);
    await executeTrackedJob(database.pool, { id, correlationId }, async ({ progress }) => {
      await progress(75);
    });
    expect(await findJobExecution(database.pool, id)).toMatchObject({
      status: "succeeded",
      progress: 100,
      attemptCount: 2,
      safeErrorCode: null,
      safeErrorMessage: null,
    });
  });

  it("reports readiness only for a recent ready worker heartbeat", async () => {
    await upsertWorkerHeartbeat(database.pool, {
      instanceId: "synthetic-worker",
      queues: ["file-scan"],
      status: "ready",
    });
    expect(await isWorkerReady(database.pool, 30_000)).toBe(true);
    await database.pool.query(
      "UPDATE worker_heartbeat SET last_heartbeat_at = now() - interval '2 minutes'",
    );
    expect(await isWorkerReady(database.pool, 30_000)).toBe(false);
  });
});
