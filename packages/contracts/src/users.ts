import { z } from "zod";
import { idSchema, nonEmptyReasonSchema, pageSchema, paginationQuerySchema } from "./common";
import { currentUserSchema, userStatusSchema } from "./auth";

export const userSchema = currentUserSchema.omit({ permissions: true });

export const userPageSchema = pageSchema(userSchema);

export const userListQuerySchema = paginationQuerySchema.extend({
  cursor: idSchema.optional(),
  status: userStatusSchema.optional(),
});

export const createUserRequestSchema = z
  .object({
    email: z.email(),
    name: z.string().trim().min(1).max(160),
    roleIds: z.array(idSchema),
    justification: nonEmptyReasonSchema,
  })
  .strict()
  .refine(({ roleIds }) => new Set(roleIds).size === roleIds.length, {
    path: ["roleIds"],
    message: "Role identifiers must be unique",
  });

export const updateUserRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    status: userStatusSchema.optional(),
    version: z.number().int().positive(),
    justification: nonEmptyReasonSchema,
  })
  .strict()
  .refine(({ name, status }) => name !== undefined || status !== undefined, {
    message: "At least one change is required",
  });

export type User = z.infer<typeof userSchema>;
export type UserPage = z.infer<typeof userPageSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
