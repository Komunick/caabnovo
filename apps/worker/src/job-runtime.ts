import type { Pool } from "pg";
import {
  markJobFailed,
  markJobRunning,
  markJobSucceeded,
  updateJobProgress,
} from "@caab/db/repositories/job-execution";
import { runWithWorkerContext } from "./request-context.js";
import { logger } from "./logger.js";
import { safeJobFailure } from "./job-state.js";
import { recordJobCompletion, withWorkerSpan } from "./metrics.js";

export interface JobRuntimeContext {
  progress(value: number): Promise<void>;
}

export async function executeTrackedJob(
  pool: Pool,
  job: { id: string; correlationId: string; requestId?: string; jobType?: string },
  handler: (context: JobRuntimeContext) => Promise<void>,
): Promise<void> {
  const jobType = job.jobType ?? "unknown";
  const startedAt = performance.now();
  try {
    await withWorkerSpan(
      `job ${jobType}`,
      { "job.id": job.id, "job.type": jobType, "correlation.id": job.correlationId },
      async () => {
        await markJobRunning(pool, job.id);
        await runWithWorkerContext(
          { jobId: job.id, correlationId: job.correlationId, requestId: job.requestId },
          async () => {
            try {
              await handler({ progress: (value) => updateJobProgress(pool, job.id, value) });
              await markJobSucceeded(pool, job.id);
            } catch (error) {
              const safeFailure = safeJobFailure(error);
              await markJobFailed(pool, job.id, safeFailure.code, safeFailure.message);
              logger.error(
                { event: "job.failed", jobId: job.id, errorCode: safeFailure.code },
                "Job failed",
              );
              throw error;
            }
          },
        );
      },
    );
    recordJobCompletion(jobType, "success", performance.now() - startedAt);
  } catch (error) {
    recordJobCompletion(jobType, "failure", performance.now() - startedAt);
    throw error;
  }
}
