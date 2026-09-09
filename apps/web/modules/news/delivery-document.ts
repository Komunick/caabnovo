import "server-only";
import {
  newsChannelSchema,
  newsDeliveryDocumentSchema,
  newsDraftMetadataSchema,
} from "@caab/contracts";
import { NewsPolicyError } from "./errors";

/** Accept only the main published CMS record, never a serialized draft or client input. */
export function newsDeliveryDocument(published: Record<string, unknown>, destination: unknown) {
  const channel = newsChannelSchema.parse(destination);
  const metadata = newsDraftMetadataSchema.parse(published.metadata);
  if (
    published._status !== "published" ||
    published.archived === true ||
    !metadata.channels.includes(channel)
  )
    throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Publicação não disponível neste canal.");
  return newsDeliveryDocumentSchema.parse({
    schemaVersion: 1,
    id: published.id,
    revision: published.revision,
    channel,
    publishedAt: published.updatedAt,
    title: metadata.title,
    summary: metadata.summary,
    slug: metadata.slug,
    category: metadata.category,
    tags: metadata.tags,
    highlight: metadata.highlight,
    cover: metadata.cover,
    body: published.body,
  });
}
