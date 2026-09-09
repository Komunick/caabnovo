import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";
import { newsBodyImages, newsBodySchema } from "./news-body";
import { newsChannelSchema, newsCoverSchema, newsHighlightSchema } from "./news";

// Transport-independent publication snapshot. It does not grant access to private media URLs.
export const newsDeliveryDocumentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: idSchema,
  revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  channel: newsChannelSchema,
  publishedAt: isoDateTimeSchema,
  title: z.string().trim().min(1).max(200),
  summary: z.string().max(500),
  slug: z
    .string()
    .min(1)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().max(80),
  tags: z.array(z.string().min(1).max(80)).max(20),
  highlight: newsHighlightSchema,
  cover: newsCoverSchema.extend({ alt: z.string().trim().min(1).max(500) }).nullable(),
  body: newsBodySchema.refine((body) => newsBodyImages(body).every((image) => !!image.alt), {
    message: "Imagens publicadas precisam de descrição.",
  }),
});

export type NewsDeliveryDocument = z.infer<typeof newsDeliveryDocumentSchema>;
