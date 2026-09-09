import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";
import { emptyNewsBody, newsBodySchema } from "./news-body";

export const newsChannelSchema = z.enum(["site", "app"]);
const channelsSchema = z
  .array(newsChannelSchema)
  .max(2)
  .refine((channels) => new Set(channels).size === channels.length, {
    message: "Canais não podem se repetir.",
  });
const versionSchema = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);

export const newsCoverSchema = z.strictObject({
  fileId: idSchema,
  alt: z.string().trim().max(500).default(""),
});
export const newsHighlightSchema = z
  .strictObject({ order: z.number().int().min(1).max(100) })
  .nullable()
  .default(null);

// Metadata is plain text. Rich text will have its own validated contract at the CMS boundary.
export const newsDraftMetadataSchema = z.strictObject({
  title: z.string().trim().max(200).default(""),
  summary: z.string().trim().max(500).default(""),
  slug: z
    .string()
    .trim()
    .max(180)
    .regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/, "Use letras minúsculas, números e hífens.")
    .default(""),
  category: z.string().trim().max(80).default(""),
  tags: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  channels: channelsSchema.default([]),
  cover: newsCoverSchema.nullable().default(null),
  highlight: newsHighlightSchema,
});

export const createNewsDraftRequestSchema = z.strictObject({
  metadata: newsDraftMetadataSchema,
  body: newsBodySchema.default(emptyNewsBody),
});

// Full metadata replacement, not PATCH: omitted metadata fields reset to draft defaults.
export const updateNewsDraftRequestSchema = z.strictObject({
  expectedVersion: versionSchema,
  metadata: newsDraftMetadataSchema,
  body: newsBodySchema,
});

export const newsVersionCommandSchema = z.strictObject({ expectedVersion: versionSchema });
export const restoreNewsRevisionRequestSchema = z.strictObject({
  expectedVersion: versionSchema,
  versionId: idSchema,
});
export const newsListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  state: z.enum(["active", "archived", "all"]).default("active"),
  collection: z.enum(["all", "published", "drafts"]).default("all"),
  search: z.string().trim().max(200).default(""),
  category: z.string().trim().max(80).default(""),
  channel: z.enum(["all", "app", "site"]).default("all"),
  highlight: z.enum(["all", "yes", "no"]).default("all"),
  cover: z.enum(["all", "yes", "no"]).default("all"),
  updatedWithin: z.enum(["all", "7", "30", "90"]).default("all"),
  sort: z
    .enum(["updated-desc", "updated-asc", "created-desc", "created-asc", "title-asc", "title-desc"])
    .default("updated-desc"),
});
export const publicNewsQuerySchema = newsListQuerySchema.pick({ page: true, search: true });

export const publishNewsRequestSchema = z.strictObject({
  expectedVersion: versionSchema,
  channels: channelsSchema.refine((channels) => channels.length > 0, {
    message: "Selecione ao menos um canal.",
  }),
});

export const scheduleNewsRequestSchema = z.strictObject({
  expectedVersion: versionSchema,
  action: z.enum(["publish", "unpublish"]),
  channels: channelsSchema.refine((channels) => channels.length > 0),
  runAt: isoDateTimeSchema,
  timezone: z.literal("America/Sao_Paulo").default("America/Sao_Paulo"),
});
export const newsActionJobPayloadSchema = z.strictObject({
  jobId: idSchema,
  actionId: idSchema,
  newsId: idSchema,
  requestId: idSchema,
  correlationId: idSchema,
});
export type NewsActionJobPayload = z.infer<typeof newsActionJobPayloadSchema>;

export type NewsChannel = z.infer<typeof newsChannelSchema>;
export type NewsDraftMetadata = z.infer<typeof newsDraftMetadataSchema>;
export type CreateNewsDraftRequest = z.infer<typeof createNewsDraftRequestSchema>;
export type UpdateNewsDraftRequest = z.infer<typeof updateNewsDraftRequestSchema>;
export type PublishNewsRequest = z.infer<typeof publishNewsRequestSchema>;
