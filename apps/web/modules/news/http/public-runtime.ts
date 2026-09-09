import "server-only";
import { getNewsPayload } from "../payload/runtime";
import { listPublicNews, readPublicNews, getPublicNewsMedia } from "../public-service";
import { getObjectStorage } from "../../files/object-storage";
import { createPublicNewsRoutes } from "./public-route";
export const publicNewsRoutes = createPublicNewsRoutes({
  list: async (channel, query) => listPublicNews(await getNewsPayload(), channel, query),
  get: async (channel, id) => readPublicNews(await getNewsPayload(), channel, id),
  media: async (channel, id, fileId) =>
    getPublicNewsMedia(await getNewsPayload(), channel, id, fileId, getObjectStorage()),
});
