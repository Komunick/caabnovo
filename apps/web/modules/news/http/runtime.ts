import "server-only";
import { resolveRequestActor } from "../../auth/request-actor";
import {
  archiveNews,
  createNewsDraft,
  duplicateNewsDraft,
  getNewsDraft,
  listNewsDrafts,
  listNewsVersions,
  restoreNewsRevision,
  updateNewsDraft,
  publishNews,
  unpublishNews,
} from "../news-service";
import { getNewsPayload } from "../payload/runtime";
import { createNewsRoutes } from "./news-route";
import { listNewsMedia, getNewsMediaDownload } from "../media-service";
import { getObjectStorage } from "../../files/object-storage";
import { getJobQueue } from "../../jobs/queue";
import {
  scheduleNews,
  cancelNewsAction,
  retryNewsAction,
  listNewsActions,
  pgBossNewsActionEnqueuer,
} from "../schedule-service";
import { newsTransaction } from "../payload/transaction";

export const newsRoutes = createNewsRoutes({
  resolveActor: resolveRequestActor,
  service: {
    publish: async (context, id, input) => publishNews(await getNewsPayload(), context, id, input),
    unpublish: async (context, id, input) =>
      unpublishNews(await getNewsPayload(), context, id, input),
    schedule: async (context, id, input) =>
      scheduleNews(
        await getNewsPayload(),
        pgBossNewsActionEnqueuer(await getJobQueue()),
        context,
        id,
        input,
      ),
    cancel: async (context, id, actionId) =>
      cancelNewsAction(await getNewsPayload(), context, id, actionId),
    retry: async (context, id, actionId) =>
      retryNewsAction(
        await getNewsPayload(),
        pgBossNewsActionEnqueuer(await getJobQueue()),
        context,
        id,
        actionId,
      ),
    publication: async (actor, id) => {
      const payload = await getNewsPayload();
      const publication = await newsTransaction(payload, actor, async ({ req }) => {
        const current = await payload.findByID({
          collection: "news",
          id,
          req,
          overrideAccess: false,
          draft: false,
          depth: 0,
        });
        return current._status === "published"
          ? {
              revision: Number(current.revision),
              channels: current.metadata?.channels as string[],
              publishedAt: String(current.updatedAt),
            }
          : null;
      });
      return { publication, actions: await listNewsActions(payload, actor, id) };
    },
    media: async (actor, id, page) => listNewsMedia(await getNewsPayload(), actor, id, page),
    mediaDownload: async (actor, id, fileId) =>
      getNewsMediaDownload(await getNewsPayload(), actor, id, fileId, getObjectStorage()),
    create: async (context, input) => createNewsDraft(await getNewsPayload(), context, input),
    get: async (actor, id) => getNewsDraft(await getNewsPayload(), actor, id),
    list: async (actor, query) => listNewsDrafts(await getNewsPayload(), actor, query),
    update: async (context, id, input) =>
      updateNewsDraft(await getNewsPayload(), context, id, input),
    duplicate: async (context, id, input) =>
      duplicateNewsDraft(await getNewsPayload(), context, id, input),
    archive: async (context, id, input) => archiveNews(await getNewsPayload(), context, id, input),
    restore: async (context, id, input) =>
      restoreNewsRevision(await getNewsPayload(), context, id, input),
    versions: async (actor, id, page) => listNewsVersions(await getNewsPayload(), actor, id, page),
  },
});
