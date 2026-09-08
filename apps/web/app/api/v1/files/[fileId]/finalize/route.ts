import { resolveRequestActor } from "@/modules/auth/request-actor";
import { finalizeUpload, pgBossFileScanEnqueuer } from "@/modules/files/file-service";
import { createFinalizeUploadRoute } from "@/modules/files/http/finalize-upload-route";
import { getObjectStorage } from "@/modules/files/object-storage";
import { getJobQueue } from "@/modules/jobs/queue";
import { getDatabase } from "@/modules/shared/database";

const route = createFinalizeUploadRoute({
  resolveActor: resolveRequestActor,
  finalize: async (command) => {
    const boss = await getJobQueue();
    return finalizeUpload(
      getDatabase().pool,
      getObjectStorage(),
      pgBossFileScanEnqueuer(boss),
      command,
    );
  },
});

export const POST = route.POST;
