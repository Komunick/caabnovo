import { idSchema, jobSchema, redriveJobRequestSchema, type Job } from "@caab/contracts";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import type { RequestActor } from "../../shared/request-context";
import { correlationId, requestId, routeError, validateMutation } from "../../files/http/responses";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export function createJobRedriveRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  redrive(input: {
    actor: RequestActor;
    jobId: string;
    reason: string;
    requestId: string;
    correlationId: string;
    effectiveIdentity: string;
  }): Promise<Job>;
}) {
  return {
    POST: async (request: Request, context: RouteContext) => {
      const currentRequestId = requestId(request);
      try {
        const actor = requirePermission(
          (await deps.resolveActor(request)) ?? undefined,
          PERMISSIONS.jobsRedrive,
        );
        validateMutation(request, false);
        const { jobId } = await context.params;
        const body = redriveJobRequestSchema.parse(await request.json());
        const job = await deps.redrive({
          actor,
          jobId: idSchema.parse(jobId),
          reason: body.reason,
          requestId: currentRequestId,
          correlationId: correlationId(request),
          effectiveIdentity: `user:${actor.userId}`,
        });
        return Response.json(jobSchema.parse(job), { status: 202 });
      } catch (error) {
        return routeError(error, currentRequestId);
      }
    },
  };
}
