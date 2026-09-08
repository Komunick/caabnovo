import { resolveRequestActor } from "@/modules/auth/request-actor";
import { createJobStatusRoute } from "@/modules/jobs/http/job-status-route";
import { findAuthorizedJob } from "@/modules/jobs/job-service";
import { getDatabase } from "@/modules/shared/database";

const route = createJobStatusRoute({
  resolveActor: resolveRequestActor,
  find: (actor, jobId) => findAuthorizedJob(getDatabase().pool, actor, jobId),
});

export const GET = route.GET;
