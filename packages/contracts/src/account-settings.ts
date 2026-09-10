import { z } from "zod";
import { newPasswordSchema, PASSWORD_MAX_LENGTH } from "./password-policy";

const version = z.number().int().positive();
const currentPassword = z.string().min(1).max(128);
export const accountSettingsRequestSchema = z.discriminatedUnion("action", [
  z
    .object({ action: z.literal("profile"), name: z.string().trim().min(1).max(160), version })
    .strict(),
  z
    .object({
      action: z.literal("password"),
      currentPassword,
      newPassword: newPasswordSchema,
      confirmPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
      version,
    })
    .strict(),
  z
    .object({
      action: z.literal("request-email"),
      currentPassword,
      newEmail: z
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),
      version,
    })
    .strict(),
  z
    .object({ action: z.literal("confirm-email"), token: z.string().regex(/^[a-f0-9]{64}$/) })
    .strict(),
]);
export type AccountSettingsRequest = z.infer<typeof accountSettingsRequestSchema>;
