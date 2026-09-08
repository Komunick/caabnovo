import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import {
  pgBossAuditExportEnqueuer,
  requestAuditExport,
} from "@/modules/audit/audit-export-service";
import { createAuditExportsRoute } from "@/modules/audit/http/audit-exports-route";
import { getJobQueue } from "@/modules/jobs/queue";

const route = createAuditExportsRoute({
  resolveActor: resolveRequestActor,
  create: async (command) => {
    const boss = await getJobQueue();
    return requestAuditExport(getDatabase().pool, command, pgBossAuditExportEnqueuer(boss));
  },
});

export const POST = route.POST;
