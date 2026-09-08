import { z } from "zod";

export const idSchema = z.uuid();
export const requestIdSchema = z.uuid();
export const correlationIdSchema = z.uuid();
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
export const nonEmptyReasonSchema = z.string().trim().min(1);

export const paginationQuerySchema = z.object({
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export function pageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export const requestMetadataSchema = z.object({
  requestId: requestIdSchema,
  correlationId: correlationIdSchema,
});

export type RequestMetadata = z.infer<typeof requestMetadataSchema>;
