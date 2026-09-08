import { idSchema, jobSchema, type Job } from "@caab/contracts";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import type { RequestActor } from "../../shared/request-context";
import { requestId, routeError } from "../../files/http/responses";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export function createJobStatusRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  find(actor: RequestActor, jobId: string): Promise<Job | null>;
}) {
  return {
    GET: async (request: Request, context: RouteContext) => {
      const currentRequestId = requestId(request);
      try {
        const actor = requirePermission(
          (await deps.resolveActor(request)) ?? undefined,
          PERMISSIONS.jobsRead,
        );
        const { jobId } = await context.params;
        const job = await deps.find(actor, idSchema.parse(jobId));
        if (!job) {
          throw Object.assign(new Error("Job not found"), { code: "NOT_FOUND", status: 404 });
        }
        return Response.json(jobSchema.parse(job));
      } catch (error) {
        return routeError(error, currentRequestId);
      }
    },
  };
}
