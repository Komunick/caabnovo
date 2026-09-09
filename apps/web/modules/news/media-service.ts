import "server-only";
import type { Payload } from "payload";
import { idSchema, newsListQuerySchema } from "@caab/contracts";
import { requirePermission } from "../auth/authorize";
import { PERMISSIONS } from "../auth/permissions";
import type { RequestActor } from "../shared/request-context";
import type { WebObjectStorage } from "../files/object-storage";
import { NewsPolicyError } from "./errors";
import { newsTransaction } from "./payload/transaction";

export async function getUsableNewsMediaIds(
  payload: Payload,
  actor: RequestActor | undefined,
  newsId: string,
  fileIds: string[],
) {
  requirePermission(actor, PERMISSIONS.filesRead);
  idSchema.parse(newsId);
  const ids = [...new Set(fileIds.map((id) => idSchema.parse(id)))];
  return newsTransaction(payload, actor, async ({ mediaFiles }) =>
    (await mediaFiles(ids))
      .filter((file) => file.ownerNewsId === newsId && file.usable)
      .map((file) => file.id),
  );
}

export async function listNewsMedia(
  payload: Payload,
  actor: RequestActor | undefined,
  newsId: string,
  page = 1,
) {
  requirePermission(actor, PERMISSIONS.filesRead);
  idSchema.parse(newsId);
  newsListQuerySchema.parse({ page });
  return newsTransaction(payload, actor, async ({ req, listMedia }) => {
    const news = await payload.findByID({
      collection: "news",
      id: newsId,
      req,
      overrideAccess: false,
      draft: true,
      depth: 0,
      disableErrors: true,
    });
    if (!news) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Notícia não encontrada.");
    const files = await listMedia(newsId, page);
    return {
      items: files.slice(0, 25).map((file) => ({
        id: file.id,
        name: file.name,
        status: file.status,
        mime: file.mime ?? file.declaredMime,
        usable: file.usable,
      })),
      page,
      hasNextPage: files.length > 25,
    };
  });
}

export async function getNewsMediaDownload(
  payload: Payload,
  actor: RequestActor | undefined,
  newsId: string,
  fileId: string,
  storage: Pick<WebObjectStorage, "createPrivateDownload">,
) {
  requirePermission(actor, PERMISSIONS.filesRead);
  idSchema.parse(newsId);
  idSchema.parse(fileId);
  return newsTransaction(payload, actor, async ({ req, mediaFiles }) => {
    const news = await payload.findByID({
      collection: "news",
      id: newsId,
      req,
      overrideAccess: false,
      draft: true,
      depth: 0,
      disableErrors: true,
    });
    if (!news) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Notícia não encontrada.");
    const file = (await mediaFiles([fileId]))[0];
    if (!file || file.ownerNewsId !== newsId)
      throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Arquivo não encontrado nesta notícia.");
    if (!file.usable)
      throw new NewsPolicyError("NEWS_MEDIA_UNAVAILABLE", 409, "Arquivo ainda não liberado.");
    const grant = await storage.createPrivateDownload(file.objectKey);
    return { url: grant.url, expiresAt: grant.expiresAt.toISOString() };
  });
}
