import { resolveRequestActor } from "@/modules/auth/request-actor";
import { createJobRedriveRoute } from "@/modules/jobs/http/job-redrive-route";
import { getJobQueue } from "@/modules/jobs/queue";
import { pgBossRedriveEnqueuer, redriveJob } from "@/modules/jobs/job-service";
import { getDatabase } from "@/modules/shared/database";

const route = createJobRedriveRoute({
  resolveActor: resolveRequestActor,
  redrive: async ({ actor, ...input }) => {
    const boss = await getJobQueue();
    return redriveJob(getDatabase().pool, actor, input, pgBossRedriveEnqueuer(boss));
  },
});

export const POST = route.POST;
