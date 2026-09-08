import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";
import { nonEmptyReasonSchema } from "./common";

export const jobReferenceSchema = z.object({
  jobId: idSchema,
  statusUrl: z.string().startsWith("/"),
});

export const jobSchema = z.object({
  id: idSchema,
  jobType: z.string().min(1),
  status: z.enum(["queued", "running", "succeeded", "failed"]),
  progress: z.number().int().min(0).max(100),
  attemptCount: z.number().int().min(0),
  safeErrorCode: z.string().nullable(),
  safeErrorMessage: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  finishedAt: isoDateTimeSchema.nullable(),
  correlationId: idSchema,
});

export const redriveJobRequestSchema = z.object({
  reason: nonEmptyReasonSchema.max(500),
});

export type JobReference = z.infer<typeof jobReferenceSchema>;
export type Job = z.infer<typeof jobSchema>;
export type RedriveJobRequest = z.infer<typeof redriveJobRequestSchema>;
