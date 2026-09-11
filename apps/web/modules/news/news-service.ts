import "server-only";
import { queryNewsList } from "./list-query";
import { createHash } from "node:crypto";
import type { Payload, PayloadRequest } from "payload";
import {
  idSchema,
  newsBodySchema,
  newsBodyImages,
  newsDraftMetadataSchema,
  newsVersionCommandSchema,
  restoreNewsRevisionRequestSchema,
  newsListQuerySchema,
  publishNewsRequestSchema,
  type NewsBody,
  type NewsDraftMetadata,
} from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import { prepareNewsDraft, prepareNewsDraftUpdate } from "./draft-policy";
import { NewsPolicyError } from "./errors";
import {
  newsTransaction,
  newsWriteTransaction,
  newsPublishTransaction,
} from "./payload/transaction";
import { requirePermission } from "../auth/authorize";
import { PERMISSIONS } from "../auth/permissions";
import { publishNewsRevision, withdrawNewsChannels } from "@caab/news/publication";
import { newsDeliveryDocument } from "./delivery-document";

export interface NewsRecord {
  id: string;
  metadata: NewsDraftMetadata;
  body: NewsBody;
  revision: number;
  archived: boolean;
  editorUserId: string;
  updatedAt: string;
}
export interface NewsCommandContext {
  actor: RequestActor | undefined;
  requestId: string;
  correlationId: string;
  idempotencyKey?: string;
}

async function readDraft(payload: Payload, req: Partial<PayloadRequest>, id: string) {
  const doc = await payload.findByID({
    collection: "news",
    id,
    req,
    overrideAccess: false,
    draft: true,
    depth: 0,
    disableErrors: true,
  });
  if (!doc) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Notícia não encontrada.");
  return doc;
}

function requireVersion(doc: Record<string, unknown>, expectedVersion: number) {
  if (Number(doc.revision) !== expectedVersion) {
    throw new NewsPolicyError(
      "NEWS_VERSION_CONFLICT",
      409,
      "A notícia foi alterada. Reabra a versão atual.",
    );
  }
}

function serialize(doc: Record<string, unknown>): NewsRecord {
  return {
    id: idSchema.parse(doc.id),
    metadata: newsDraftMetadataSchema.parse(doc.metadata),
    body: newsBodySchema.parse(doc.body),
    revision: Number(doc.revision),
    archived: doc.archived === true,
    editorUserId: String(doc.editorUserId),
    updatedAt: String(doc.updatedAt),
  };
}

export async function createNewsDraft(
  payload: Payload,
  context: NewsCommandContext,
  input: unknown,
) {
  const prepared = prepareNewsDraft(context.actor, input);
  if (prepared.metadata.cover || newsBodyImages(prepared.body).length)
    throw new NewsPolicyError("NEWS_NOT_READY", 422, "Salve a notícia antes de anexar imagens.");
  const key = context.idempotencyKey ?? crypto.randomUUID();
  const fingerprint = createHash("sha256").update(JSON.stringify(prepared)).digest("hex");
  return newsWriteTransaction(
    payload,
    context.actor,
    async ({ req, audit, claimCreation, finishCreation }) => {
      const previousId = await claimCreation(key, fingerprint);
      if (previousId) {
        return serialize(
          await payload.findByID({
            collection: "news",
            id: previousId,
            req,
            overrideAccess: false,
            draft: true,
            depth: 0,
          }),
        );
      }
      const doc = await payload.create({
        collection: "news",
        overrideAccess: false,
        req,
        draft: true,
        depth: 0,
        data: { ...prepared, revision: 1, archived: false, _status: "draft" },
      });
      await audit({
        actorUserId: prepared.editorUserId,
        effectiveIdentity: `user:${prepared.editorUserId}`,
        action: "news.draft.created",
        entityType: "news",
        entityId: String(doc.id),
        after: { revision: 1 },
        origin: "web",
        requestId: context.requestId,
        correlationId: context.correlationId,
      });
      await finishCreation(key, String(doc.id));
      return serialize(doc);
    },
  );
}

export async function getNewsDraft(payload: Payload, actor: RequestActor | undefined, id: string) {
  idSchema.parse(id);
  return newsTransaction(payload, actor, async ({ req }) =>
    serialize(await readDraft(payload, req, id)),
  );
}

// Internal bridge for the future consumer adapter. Panel session is still required here;
// this is not an app/site endpoint or the authentication policy for an external consumer.
export async function getNewsDeliverySnapshot(
  payload: Payload,
  actor: RequestActor | undefined,
  id: string,
  channel: unknown,
) {
  idSchema.parse(id);
  return newsTransaction(payload, actor, async ({ req }) => {
    const published = await payload.findByID({
      collection: "news",
      id,
      req,
      overrideAccess: false,
      draft: false,
      depth: 0,
      disableErrors: true,
    });
    if (!published) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Publicação não encontrada.");
    return newsDeliveryDocument(published, channel);
  });
}

export async function listNewsDrafts(
  payload: Payload,
  actor: RequestActor | undefined,
  input: unknown = {},
) {
  const query = newsListQuerySchema.parse(input);
  return newsTransaction(payload, actor, async ({ db }) => {
    const result = await queryNewsList(db, query);
    return { items: result.docs.map(serialize), page: query.page, totalPages: result.totalPages };
  });
}

export async function updateNewsDraft(
  payload: Payload,
  context: NewsCommandContext,
  id: string,
  input: unknown,
) {
  idSchema.parse(id);
  return newsWriteTransaction(
    payload,
    context.actor,
    async ({ req, lockNews, audit, mediaFiles }) => {
      await lockNews(id);
      const before = await readDraft(payload, req, id);
      if (before.archived) throw new NewsPolicyError("NEWS_ARCHIVED", 409, "Notícia arquivada.");
      const prepared = prepareNewsDraftUpdate(context.actor, input, Number(before.revision));
      const previousCover = newsDraftMetadataSchema.parse(before.metadata).cover;
      const previousIds = new Set([
        ...newsBodyImages(newsBodySchema.parse(before.body)).map((image) => image.fileId!),
        ...(previousCover ? [previousCover.fileId] : []),
      ]);
      const fileIds = [
        ...new Set([
          ...newsBodyImages(prepared.body).map((image) => image.fileId!),
          ...(prepared.metadata.cover ? [prepared.metadata.cover.fileId] : []),
        ]),
      ];
      if (fileIds.some((fileId) => !previousIds.has(fileId)))
        requirePermission(context.actor, PERMISSIONS.filesRead);
      const files = await mediaFiles(fileIds);
      if (
        files.length !== fileIds.length ||
        files.some(
          (file) =>
            file.ownerNewsId !== id || !["image/png", "image/jpeg"].includes(file.declaredMime),
        )
      )
        throw new NewsPolicyError(
          "NEWS_NOT_READY",
          422,
          "As imagens devem pertencer a esta notícia.",
        );
      const revision = prepared.expectedVersion + 1;
      const doc = await payload.update({
        collection: "news",
        id,
        req,
        overrideAccess: false,
        overrideLock: false,
        draft: true,
        depth: 0,
        data: {
          metadata: prepared.metadata,
          body: prepared.body,
          editorUserId: prepared.editorUserId,
          revision,
          _status: "draft",
        },
      });
      await audit({
        actorUserId: prepared.editorUserId,
        effectiveIdentity: `user:${prepared.editorUserId}`,
        action: "news.draft.updated",
        entityType: "news",
        entityId: id,
        before: { revision: prepared.expectedVersion },
        after: { revision },
        origin: "web",
        requestId: context.requestId,
        correlationId: context.correlationId,
      });
      return serialize(doc);
    },
  );
}

export async function listNewsVersions(
  payload: Payload,
  actor: RequestActor | undefined,
  id: string,
  page = 1,
) {
  idSchema.parse(id);
  newsListQuerySchema.parse({ page });
  return newsTransaction(payload, actor, async ({ req }) => {
    await readDraft(payload, req, id);
    const result = await payload.findVersions({
      collection: "news",
      req,
      overrideAccess: false,
      depth: 0,
      where: { parent: { equals: id } },
      sort: ["-createdAt", "-id"],
      page,
      limit: 25,
    });
    return {
      items: result.docs.map((doc) => ({
        id: String(doc.id),
        revision: Number(doc.version.revision),
        title: String(doc.version.metadata?.title ?? ""),
        editorUserId: String(doc.version.editorUserId),
        createdAt: String(doc.createdAt),
        archived: doc.version.archived === true,
      })),
      page: result.page ?? 1,
      totalPages: result.totalPages,
    };
  });
}

export async function duplicateNewsDraft(
  payload: Payload,
  context: NewsCommandContext,
  id: string,
  input: unknown,
) {
  idSchema.parse(id);
  const command = newsVersionCommandSchema.parse(input);
  const key = context.idempotencyKey ?? crypto.randomUUID();
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ operation: "duplicate", id, ...command }))
    .digest("hex");
  return newsWriteTransaction(
    payload,
    context.actor,
    async ({ req, lockNews, audit, claimCreation, finishCreation }) => {
      const previousId = await claimCreation(key, fingerprint);
      if (previousId) return serialize(await readDraft(payload, req, previousId));
      await lockNews(id);
      const source = await readDraft(payload, req, id);
      requireVersion(source, command.expectedVersion);
      const prepared = prepareNewsDraft(context.actor, {
        metadata: {
          ...newsDraftMetadataSchema.parse(source.metadata),
          slug: "",
          channels: [],
          cover: null,
          highlight: null,
        },
        body: {
          root: {
            ...newsBodySchema.parse(source.body).root,
            children: newsBodySchema
              .parse(source.body)
              .root.children?.filter((node) => node.type !== "news-image"),
          },
        },
      });
      const doc = await payload.create({
        collection: "news",
        req,
        overrideAccess: false,
        draft: true,
        depth: 0,
        data: { ...prepared, revision: 1, archived: false, _status: "draft" },
      });
      await audit({
        actorUserId: prepared.editorUserId,
        effectiveIdentity: `user:${prepared.editorUserId}`,
        action: "news.draft.duplicated",
        entityType: "news",
        entityId: String(doc.id),
        after: { revision: 1, sourceId: id, sourceRevision: command.expectedVersion },
        origin: "web",
        requestId: context.requestId,
        correlationId: context.correlationId,
      });
      await finishCreation(key, String(doc.id));
      return serialize(doc);
    },
  );
}

export async function archiveNews(
  payload: Payload,
  context: NewsCommandContext,
  id: string,
  input: unknown,
) {
  idSchema.parse(id);
  const command = newsVersionCommandSchema.parse(input);
  return newsPublishTransaction(payload, context.actor, async ({ req, lockNews, audit, db }) => {
    await lockNews(id);
    const before = await readDraft(payload, req, id);
    requireVersion(before, command.expectedVersion);
    if (before.archived) return serialize(before);
    const cancelled = await db.query(
      "UPDATE news_action SET status='cancelled',completed_at=now(),cancelled_by=$2::uuid WHERE news_id=$1::uuid AND status='pending' RETURNING id",
      [id, context.actor!.userId],
    );
    const revision = command.expectedVersion + 1;
    const doc = await payload.update({
      collection: "news",
      id,
      req,
      overrideAccess: false,
      overrideLock: false,
      // draft:false updates the main record as well, withdrawing any published revision.
      draft: false,
      depth: 0,
      data: {
        metadata: before.metadata,
        body: before.body,
        archived: true,
        revision,
        editorUserId: context.actor!.userId,
        _status: "draft",
      },
    });
    await audit({
      actorUserId: context.actor!.userId,
      effectiveIdentity: `user:${context.actor!.userId}`,
      action: "news.archived",
      entityType: "news",
      entityId: id,
      before: { revision: command.expectedVersion, archived: false },
      after: { revision, archived: true, cancelledActionIds: cancelled.rows.map((row) => row.id) },
      origin: "web",
      requestId: context.requestId,
      correlationId: context.correlationId,
    });
    return serialize(doc);
  });
}

export async function restoreNewsRevision(
  payload: Payload,
  context: NewsCommandContext,
  id: string,
  input: unknown,
) {
  idSchema.parse(id);
  const command = restoreNewsRevisionRequestSchema.parse(input);
  return newsWriteTransaction(payload, context.actor, async ({ req, lockNews, audit }) => {
    await lockNews(id);
    const before = await readDraft(payload, req, id);
    requireVersion(before, command.expectedVersion);
    const versions = await payload.findVersions({
      collection: "news",
      req,
      overrideAccess: false,
      depth: 0,
      limit: 1,
      where: { and: [{ parent: { equals: id } }, { id: { equals: command.versionId } }] },
    });
    const source = versions.docs[0];
    if (!source)
      throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Versão não encontrada nesta notícia.");
    const prepared = prepareNewsDraft(context.actor, {
      metadata: source.version.metadata,
      body: source.version.body,
    });
    const revision = command.expectedVersion + 1;
    // Copy content into a NEW draft; native restore could also restore a published status.
    const doc = await payload.update({
      collection: "news",
      id,
      req,
      overrideAccess: false,
      overrideLock: false,
      draft: true,
      depth: 0,
      data: { ...prepared, revision, archived: false, _status: "draft" },
    });
    await audit({
      actorUserId: prepared.editorUserId,
      effectiveIdentity: `user:${prepared.editorUserId}`,
      action: "news.revision.restored",
      entityType: "news",
      entityId: id,
      before: { revision: command.expectedVersion },
      after: { revision, sourceRevision: Number(source.version.revision) },
      origin: "web",
      requestId: context.requestId,
      correlationId: context.correlationId,
    });
    return serialize(doc);
  });
}

// Internal until consumer access and media resolution are configured.
export async function publishNews(
  payload: Payload,
  context: NewsCommandContext,
  id: string,
  input: unknown,
) {
  idSchema.parse(id);
  return newsPublishTransaction(
    payload,
    context.actor,
    async ({ req, db, lockNews, claimCreation, finishCreation }) => {
      if (context.idempotencyKey) {
        const fingerprint = createHash("sha256")
          .update(JSON.stringify({ action: "publish", id, input }))
          .digest("hex");
        const existing = await claimCreation(context.idempotencyKey, fingerprint);
        if (existing) return serialize(await readDraft(payload, req, existing));
      }
      await lockNews(id);
      const before = await readDraft(payload, req, id);
      const published = await publishNewsRevision(payload, db, req, id, before, before, input, {
        actorUserId: context.actor!.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        origin: "web",
      });
      if (context.idempotencyKey) await finishCreation(context.idempotencyKey, id);
      return serialize(published);
    },
  );
}

export async function unpublishNews(
  payload: Payload,
  context: NewsCommandContext,
  id: string,
  input: unknown,
) {
  idSchema.parse(id);
  const command = publishNewsRequestSchema.parse(input);
  return newsPublishTransaction(
    payload,
    context.actor,
    async ({ db, req, lockNews, claimCreation, finishCreation }) => {
      if (context.idempotencyKey) {
        const fingerprint = createHash("sha256")
          .update(JSON.stringify({ action: "unpublish", id, command }))
          .digest("hex");
        const existing = await claimCreation(context.idempotencyKey, fingerprint);
        if (existing) return serialize(await readDraft(payload, req, existing));
      }
      await lockNews(id);
      const latest = await readDraft(payload, req, id);
      requireVersion(latest, command.expectedVersion);
      await withdrawNewsChannels(payload, db, req, id, command.channels, latest, {
        actorUserId: context.actor!.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        origin: "web",
      });
      if (context.idempotencyKey) await finishCreation(context.idempotencyKey, id);
      return serialize(await readDraft(payload, req, id));
    },
  );
}
