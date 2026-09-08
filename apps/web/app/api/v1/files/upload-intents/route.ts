import { resolveRequestActor } from "@/modules/auth/request-actor";
import { createUploadIntent } from "@/modules/files/file-service";
import { createUploadIntentRoute } from "@/modules/files/http/upload-intent-route";
import { getObjectStorage } from "@/modules/files/object-storage";
import { getDatabase } from "@/modules/shared/database";

const route = createUploadIntentRoute({
  resolveActor: resolveRequestActor,
  create: (command) => createUploadIntent(getDatabase().pool, getObjectStorage(), command),
});

export const POST = route.POST;
