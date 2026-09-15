import { z } from "zod";
import { idSchema, isoDateTimeSchema, paginationQuerySchema, pageSchema } from "./common";
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
  reason: nonEmptyReasonSchema.max(500).default(""),
});

export const jobListQuerySchema = paginationQuerySchema.extend({
  status: jobSchema.shape.status.optional(),
  jobType: z.string().trim().min(1).max(100).optional(),
  cursor: z
    .string()
    .max(512)
    .refine((value) => {
      const parts = value.split("|");
      return (
        parts.length === 2 &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(parts[0]!) &&
        isoDateTimeSchema.safeParse(parts[0]).success &&
        idSchema.safeParse(parts[1]).success
      );
    }, "Invalid job cursor")
    .optional(),
});
export const jobListSchema = pageSchema(jobSchema);
export type JobListQuery = z.infer<typeof jobListQuerySchema>;
export type JobList = z.infer<typeof jobListSchema>;

export type JobReference = z.infer<typeof jobReferenceSchema>;
export type Job = z.infer<typeof jobSchema>;
export type RedriveJobRequest = z.infer<typeof redriveJobRequestSchema>;
