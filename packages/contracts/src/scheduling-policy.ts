import { z } from "zod";

const hours = z.number().int().min(0).max(2147483647);
export const schedulingPolicySchema = z
  .object({
    immediateConfirmation: z.boolean().default(true),
    audience: z.enum(["all", "holders"]).default("all"),
    mode: z.enum(["professional", "capacity"]).default("professional"),
    capacity: z.number().int().min(1).max(2147483647).default(1),
    allowProfessionalChoice: z.boolean().default(true),
    minimumNoticeHours: hours.default(0),
    horizonDays: z.number().int().min(1).max(2147483647).nullable().default(90),
    rescheduleNoticeHours: hours.default(24),
    reviewAlertHours: hours.nullable().default(24),
    urgencyHours: hours.default(24),
  })
  .strict();
export type SchedulingPolicy = z.infer<typeof schedulingPolicySchema>;
export const schedulingPolicySaveSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    policy: schedulingPolicySchema,
    publish: z.boolean(),
  })
  .strict();
