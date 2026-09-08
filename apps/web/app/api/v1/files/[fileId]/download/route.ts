import { resolveRequestActor } from "@/modules/auth/request-actor";
import { createDownloadGrant } from "@/modules/files/file-service";
import { createDownloadRoute } from "@/modules/files/http/download-route";
import { getObjectStorage } from "@/modules/files/object-storage";
import { getDatabase } from "@/modules/shared/database";

const route = createDownloadRoute({
  resolveActor: resolveRequestActor,
  createGrant: (actor, fileId) =>
    createDownloadGrant(getDatabase().pool, getObjectStorage(), actor, fileId),
});

export const GET = route.GET;
