import { z } from "zod";
import { requestIdSchema } from "./common";

export const apiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: requestIdSchema,
});

export const validationIssueSchema = z.object({
  path: z.string(),
  code: z.string().min(1),
});

export const validationErrorSchema = apiErrorSchema.extend({
  fields: z.array(validationIssueSchema),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ValidationError = z.infer<typeof validationErrorSchema>;

export function apiError(code: string, message: string, requestId: string): ApiError {
  return apiErrorSchema.parse({ code, message, requestId });
}
