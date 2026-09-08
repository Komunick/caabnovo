import type { Pool } from "pg";
import {
  markJobFailed,
  markJobRunning,
  markJobSucceeded,
  updateJobProgress,
} from "@caab/db/repositories/job-execution";
import { runWithWorkerContext } from "./request-context.js";
import { logger } from "./logger.js";

export interface JobRuntimeContext {
  progress(value: number): Promise<void>;
}

export async function executeTrackedJob(
  pool: Pool,
  job: { id: string; correlationId: string; requestId?: string },
  handler: (context: JobRuntimeContext) => Promise<void>,
): Promise<void> {
  await markJobRunning(pool, job.id);
  await runWithWorkerContext(
    { jobId: job.id, correlationId: job.correlationId, requestId: job.requestId },
    async () => {
      try {
        await handler({ progress: (value) => updateJobProgress(pool, job.id, value) });
        await markJobSucceeded(pool, job.id);
      } catch (error) {
        await markJobFailed(pool, job.id, "JOB_FAILED", "The operation could not be completed");
        logger.error({ event: "job.failed", jobId: job.id, errorCode: "JOB_FAILED" }, "Job failed");
        throw error;
      }
    },
  );
}
