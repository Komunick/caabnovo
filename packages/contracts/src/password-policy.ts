import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_REQUIREMENTS =
  "Use letras maiúsculas, minúsculas e números. Símbolos são opcionais.";
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH)
  .regex(/\p{Lu}/u)
  .regex(/\p{Ll}/u)
  .regex(/[0-9]/);
