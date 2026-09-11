import "server-only";
import type { Payload } from "payload";
import {
  idSchema,
  newsChannelSchema,
  newsBodyImages,
  publicNewsQuerySchema,
} from "@caab/contracts";
import { withNewsDatabase, type NewsDatabase } from "@caab/news/database";
import { readNewsMedia } from "@caab/news/media";
import { newsDeliveryDocument } from "./delivery-document";
import { NewsPolicyError } from "./errors";
import type { WebObjectStorage } from "../files/object-storage";

// Public read policy is deliberately separate from administrative session/permission checks.
function document(row: Record<string, unknown>, channel: string) {
  return newsDeliveryDocument(
    {
      id: row.id,
      revision: Number(row.revision),
      _status: row._status,
      archived: row.archived,
      updatedAt: new Date(String(row.updated_at)).toISOString(),
      body: row.body,
      metadata: {
        title: row.metadata_title,
        summary: row.metadata_summary,
        slug: row.metadata_slug,
        category: row.metadata_category,
        tags: row.metadata_tags,
        channels: row.metadata_channels,
        cover: row.metadata_cover,
        highlight: row.metadata_highlight,
      },
    },
    channel,
  );
}
async function readPublished(db: NewsDatabase, channel: string, id: string) {
  const row = (
    await db.query(
      "SELECT * FROM news WHERE id=$1::uuid AND _status='published' AND archived=false AND metadata_channels ? $2 FOR SHARE",
      [id, channel],
    )
  ).rows[0];
  if (!row) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Publicação não encontrada.");
  return document(row, channel);
}
export async function readPublicNews(payload: Payload, destination: unknown, id: string) {
  const channel = newsChannelSchema.parse(destination);
  idSchema.parse(id);
  return withNewsDatabase(payload, (db) => readPublished(db, channel, id));
}
export async function listPublicNews(payload: Payload, destination: unknown, query: unknown) {
  const channel = newsChannelSchema.parse(destination);
  const { page, search } = publicNewsQuerySchema.parse(query);
  return withNewsDatabase(payload, async (db) => {
    const result = await db.query(
      "SELECT * FROM news WHERE _status='published' AND archived=false AND metadata_channels ? $1 AND position(lower($2) in lower(metadata_title))>0 ORDER BY (metadata_highlight->>'order')::integer ASC NULLS LAST,updated_at DESC,id DESC LIMIT 26 OFFSET $3",
      [channel, search, (page - 1) * 25],
    );
    return {
      items: result.rows.slice(0, 25).map((row) => {
        const { body: _body, ...summary } = document(row, channel);
        void _body;
        return summary;
      }),
      page,
      hasNextPage: result.rows.length > 25,
    };
  });
}

/** Home shows the live published revision, in publication order, across both public channels. */
export async function listLatestPublicNews(payload: Payload) {
  return withNewsDatabase(payload, async (db) => {
    const result = await db.query(
      "SELECT * FROM news WHERE _status='published' AND archived=false AND (metadata_channels ? 'site' OR metadata_channels ? 'app') ORDER BY updated_at DESC,id DESC LIMIT 4",
      [],
    );
    return result.rows.map((row) => {
      const channels = row.metadata_channels as string[];
      const { body: _body, ...summary } = document(row, channels.includes("site") ? "site" : "app");
      void _body;
      return summary;
    });
  });
}
export async function readPublicNewsPage(payload: Payload, destination: unknown, id: string) {
  const channel = newsChannelSchema.parse(destination);
  idSchema.parse(id);
  return withNewsDatabase(payload, async (db) => {
    const published = await readPublished(db, channel, id);
    const ids = [
      ...newsBodyImages(published.body).map((image) => image.fileId!),
      ...(published.cover ? [published.cover.fileId] : []),
    ];
    const availableFileIds = (await readNewsMedia(db, ids))
      .filter((file) => file.ownerNewsId === id && file.usable)
      .map((file) => file.id);
    return { published, availableFileIds };
  });
}
export async function getPublicNewsMedia(
  payload: Payload,
  destination: unknown,
  id: string,
  fileId: string,
  storage: Pick<WebObjectStorage, "createPrivateDownload">,
) {
  const channel = newsChannelSchema.parse(destination);
  idSchema.parse(id);
  idSchema.parse(fileId);
  return withNewsDatabase(payload, async (db) => {
    const published = await readPublished(db, channel, id);
    const ids = new Set([
      ...newsBodyImages(published.body).map((image) => image.fileId),
      published.cover?.fileId,
    ]);
    if (!ids.has(fileId))
      throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Imagem não publicada nesta notícia.");
    const file = (await readNewsMedia(db, [fileId]))[0];
    if (!file || file.ownerNewsId !== id || !file.usable)
      throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Imagem indisponível.");
    return storage.createPrivateDownload(file.objectKey);
  });
}
