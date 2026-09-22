import { z } from "zod";
import { brazilianPhoneSchema, requiredEmailSchema } from "./brazilian-contact";
import {
  creationJustificationSchema,
  idSchema,
  nonEmptyReasonSchema,
  pageSchema,
  paginationQuerySchema,
} from "./common";
import { currentUserSchema, userStatusSchema } from "./auth";

import { brazilianAddressSchema } from "./brazilian-address";
import { isValidCpf } from "./members";

export const userCpfSchema = z
  .string()
  .trim()
  .regex(/^[\d.-]+$/)
  .transform((value) => value.replace(/[.-]/g, ""))
  .refine(isValidCpf, "Informe um CPF válido.");
export const userPhoneSchema = brazilianPhoneSchema.refine(
  (value) => value.length > 0,
  "Informe o telefone com DDD.",
);
export const userAddressSchema = brazilianAddressSchema
  .extend({
    street: z.string().trim().min(1).max(300),
    neighborhood: z.string().trim().min(1).max(100),
    number: z.string().trim().min(1).max(20),
    city: z.string().trim().min(1).max(100),
    state: brazilianAddressSchema.shape.state.refine((value) => value.length === 2),
  })
  .strict();
export const userStoredAddressSchema = brazilianAddressSchema.strict();
export const userAddressUpdateSchema = z.strictObject({
  postalCode: userStoredAddressSchema.shape.postalCode.removeDefault().optional(),
  street: userStoredAddressSchema.shape.street.removeDefault().optional(),
  neighborhood: userStoredAddressSchema.shape.neighborhood.removeDefault().optional(),
  number: userStoredAddressSchema.shape.number.removeDefault().optional(),
  complement: userStoredAddressSchema.shape.complement.removeDefault().optional(),
  city: userStoredAddressSchema.shape.city.removeDefault().optional(),
  state: userStoredAddressSchema.shape.state.removeDefault().optional(),
  address: userStoredAddressSchema.shape.address.removeDefault().optional(),
});
export type UserAddress = z.infer<typeof userStoredAddressSchema>;

export const userSchema = currentUserSchema.omit({ permissions: true }).extend({
  cpf: userCpfSchema.nullable().optional(),
  phone: userPhoneSchema.nullable().optional(),
  address: userStoredAddressSchema.nullable().optional(),
  deletionEffectiveAt: z.iso.datetime({ offset: true }).nullable().optional(),
  deletionReason: z.string().nullable().optional(),
});

export const initialPasswordResponseSchema = z.object({
  initialPassword: z.string().regex(/^[A-Z][a-z]{5,}\d{6}$/),
});
export const resetUserPasswordSchema = z.object({ version: z.number().int().positive() }).strict();
export const resetUserPasswordResponseSchema = initialPasswordResponseSchema.extend({
  version: z.number().int().positive(),
});
export const createdUserSchema = userSchema.extend({
  initialPassword: initialPasswordResponseSchema.shape.initialPassword.nullable(),
});
export type CreatedUser = z.infer<typeof createdUserSchema>;

export const userPageSchema = pageSchema(userSchema);

export const userListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(160).default(""),
  cursor: idSchema.optional(),
  status: userStatusSchema.optional(),
  deleted: z.enum(["excluded", "pending", "only", "all"]).default("excluded"),
  roleId: z.union([idSchema, z.literal("none")]).optional(),
  createdFrom: z.iso.date().optional(),
  createdTo: z.iso.date().optional(),
});

export const createUserRequestSchema = z
  .object({
    email: requiredEmailSchema,
    cpf: userCpfSchema,
    phone: userPhoneSchema,
    address: userAddressSchema,
    name: z.string().trim().min(1).max(160),
    roleIds: z.array(idSchema).max(1, "Selecione apenas um cargo."),
    justification: creationJustificationSchema,
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
    cpf: userCpfSchema.optional(),
    phone: userPhoneSchema.optional(),
    address: userAddressUpdateSchema.optional(),
    version: z.number().int().positive(),
    justification: nonEmptyReasonSchema.max(1000).default(""),
  })
  .strict()
  .refine(
    ({ name, status, cpf, phone, address }) =>
      [name, status, cpf, phone, address].some((value) => value !== undefined),
    {
      message: "At least one change is required",
    },
  );

export type User = z.infer<typeof userSchema>;
export type UserPage = z.infer<typeof userPageSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const userLifecycleSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("delete"),
    version: z.number().int().positive(),
    reason: z.string().trim().min(1).max(1000),
  }),
  z.strictObject({ action: z.literal("restore"), version: z.number().int().positive() }),
]);
export const userCpfLookupSchema = z.strictObject({ cpf: userCpfSchema });
export const userCpfLookupResultSchema = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("available") }),
  z.strictObject({ status: z.literal("existing") }),
  z.strictObject({
    status: z.literal("deleted"),
    id: idSchema,
    version: z.number().int().positive(),
    reason: z.string().nullable(),
    canRestore: z.boolean(),
  }),
]);
export type UserCpfLookupResult = z.infer<typeof userCpfLookupResultSchema>;
