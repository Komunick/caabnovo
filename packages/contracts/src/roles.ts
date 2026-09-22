import { z } from "zod";
import { isoDateTimeSchema, nonEmptyReasonSchema } from "./common";
import { roleReferenceSchema } from "./auth";

const permissionSchema = z.string().regex(/^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/);

export const roleSchema = roleReferenceSchema.extend({
  description: z.string().optional(),
  administrative: z.boolean(),
  permissions: z.array(permissionSchema),
});

export const roleChangeRequestSchema = z
  .object({
    validUntil: isoDateTimeSchema.nullable().optional(),
    justification: nonEmptyReasonSchema.max(1000).default(""),
  })
  .strict();

export type Role = z.infer<typeof roleSchema>;
export type RoleChangeRequest = z.infer<typeof roleChangeRequestSchema>;
