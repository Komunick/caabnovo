import type { Payload } from "payload";
import {
  newsBodySchema,
  newsBodyImages,
  newsDraftMetadataSchema,
  type NewsBodyNode,
} from "@caab/contracts";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import type { NewsDatabase, NewsRequest } from "./database";
import { readNewsMedia } from "./media";
import { validateNewsPublication } from "./publication-policy";
import { NewsPolicyError } from "./errors";

export interface NewsPublicationContext {
  actorUserId: string;
  requestId: string;
  correlationId: string;
  origin: "web" | "worker";
}
function hasText(node: NewsBodyNode): boolean {
  return !!node.text?.trim() || (node.children?.some(hasText) ?? false);
}
export async function preparePublication(
  db: NewsDatabase,
  id: string,
  source: Record<string, unknown>,
  actorUserId: string,
  input: unknown,
) {
  const metadata = newsDraftMetadataSchema.parse(source.metadata);
  const body = newsBodySchema.parse(source.body);
  const images = newsBodyImages(body);
  const imageIds = images.map((image) => image.fileId!);
  const files = await readNewsMedia(db, [
    ...new Set([...imageIds, ...(metadata.cover ? [metadata.cover.fileId] : [])]),
  ]);
  const command = validateNewsPublication({ userId: actorUserId }, input, {
    id,
    version: Number(source.revision),
    archived: source.archived === true,
    metadata,
    content: {
      status: images.some((image) => !image.alt)
        ? "invalid"
        : hasText(body.root) || images.length
          ? "valid"
          : "empty",
      fileIds: imageIds,
    },
    files: files.map((file) => ({
      id: file.id,
      ownerNewsId: file.ownerNewsId,
      mime: file.mime,
      status: file.usable ? "available" : "unavailable",
    })),
  });
  return { command, metadata, body };
}

/** Caller holds the news row lock. Every write, retained draft and audit shares this transaction. */
export async function publishNewsRevision(
  payload: Payload,
  db: NewsDatabase,
  req: NewsRequest,
  id: string,
  source: Record<string, unknown>,
  latest: Record<string, unknown>,
  input: unknown,
  context: NewsPublicationContext,
) {
  if (latest.archived) throw new NewsPolicyError("NEWS_ARCHIVED", 409, "Notícia arquivada.");
  const { command, metadata, body } = await preparePublication(
    db,
    id,
    source,
    context.actorUserId,
    input,
  );
  // Serialize publishers of the same slug, including different news items.
  await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
    `news:slug:${metadata.slug}`,
  ]);
  const collision = await db.query(
    "SELECT id FROM news WHERE metadata_slug=$1 AND _status='published' AND id<>$2::uuid",
    [metadata.slug, id],
  );
  if (collision.rows.length)
    throw new NewsPolicyError(
      "NEWS_SLUG_CONFLICT",
      409,
      "Este endereço já está publicado em outra notícia.",
    );
  const revision = Number(latest.revision) + 1;
  const published = await payload.update({
    collection: "news",
    id,
    req,
    overrideAccess: false,
    overrideLock: false,
    draft: false,
    depth: 0,
    data: {
      metadata: { ...metadata, channels: command.channels },
      body,
      revision,
      archived: false,
      editorUserId: context.actorUserId,
      _status: "published",
    },
  });
  // A scheduled revision may be older than a newer private draft. Keep that draft intact.
  if (Number(source.revision) !== Number(latest.revision)) {
    await payload.update({
      collection: "news",
      id,
      req,
      overrideAccess: false,
      overrideLock: false,
      draft: true,
      depth: 0,
      data: {
        metadata: latest.metadata,
        body: latest.body,
        revision: revision + 1,
        archived: false,
        editorUserId: latest.editorUserId,
        _status: "draft",
      },
    });
  }
  await writeAuditEvent(db, {
    ...context,
    effectiveIdentity: `user:${context.actorUserId}`,
    action: "news.published",
    entityType: "news",
    entityId: id,
    before: { revision: Number(latest.revision) },
    after: { revision, sourceRevision: Number(source.revision), channels: command.channels },
  });
  return published;
}

/** Withdraw selected channels without replacing a newer editorial draft with published content. */
export async function withdrawNewsChannels(
  payload: Payload,
  db: NewsDatabase,
  req: NewsRequest,
  id: string,
  channels: string[],
  latest: Record<string, unknown>,
  context: NewsPublicationContext,
) {
  const current = await payload.findByID({
    collection: "news",
    id,
    req,
    overrideAccess: false,
    draft: false,
    depth: 0,
  });
  if (current._status !== "published") return Number(latest.revision);
  const metadata = newsDraftMetadataSchema.parse(current.metadata);
  const remaining = metadata.channels.filter((channel) => !channels.includes(channel));
  if (remaining.length === metadata.channels.length) return Number(latest.revision);
  const revision = Number(latest.revision) + 1;
  await payload.update({
    collection: "news",
    id,
    req,
    overrideAccess: false,
    overrideLock: false,
    draft: false,
    depth: 0,
    data: {
      metadata: { ...metadata, channels: remaining },
      body: current.body,
      revision,
      archived: false,
      editorUserId: context.actorUserId,
      _status: remaining.length ? "published" : "draft",
    },
  });
  await payload.update({
    collection: "news",
    id,
    req,
    overrideAccess: false,
    overrideLock: false,
    draft: true,
    depth: 0,
    data: {
      metadata: latest.metadata,
      body: latest.body,
      revision: revision + 1,
      archived: false,
      editorUserId: latest.editorUserId,
      _status: "draft",
    },
  });
  await writeAuditEvent(db, {
    ...context,
    effectiveIdentity: `user:${context.actorUserId}`,
    action: "news.unpublished",
    entityType: "news",
    entityId: id,
    before: { revision: Number(current.revision), channels: metadata.channels },
    after: { revision, channels: remaining },
  });
  return revision;
}
