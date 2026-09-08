import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";

export const userStatusSchema = z.enum(["active", "disabled"]);

export const roleReferenceSchema = z.object({
  id: idSchema,
  code: z.string().min(1),
  name: z.string().min(1),
});

export type RoleReference = z.infer<typeof roleReferenceSchema>;

export const currentUserSchema = z.object({
  id: idSchema,
  email: z.email(),
  name: z.string().min(1).max(160),
  status: userStatusSchema,
  twoFactorEnabled: z.boolean(),
  roles: z.array(roleReferenceSchema),
  permissions: z.array(z.string().regex(/^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/)),
  version: z.number().int().positive(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema.nullable(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
