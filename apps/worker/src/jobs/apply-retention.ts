import { z } from "zod";

const approvalSchema = z.object({
  status: z.literal("APPROVED"),
  approvedBy: z.string().trim().min(1),
  approvedAt: z.iso.datetime({ offset: true }),
  policyVersion: z.string().trim().min(1),
  categories: z
    .array(
      z.object({
        code: z.string().trim().min(1),
        retentionDays: z.number().int().positive(),
        action: z.enum(["delete", "anonymize"]),
      }),
    )
    .min(1),
});

export type ApprovedRetentionPolicy = z.infer<typeof approvalSchema>;

export function requireApprovedRetentionPolicy(value: unknown): ApprovedRetentionPolicy {
  const parsed = approvalSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("Retention policy is not approved; automated disposal is blocked");
  }
  return parsed.data;
}

export async function applyRetention(untrustedPolicy: unknown): Promise<never> {
  requireApprovedRetentionPolicy(untrustedPolicy);
  throw new Error("Approved retention controls have not been implemented; production is blocked");
}
