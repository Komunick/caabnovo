import {
  auditExportRequestSchema,
  jobReferenceSchema,
  type AuditExportRequest,
  type JobReference,
} from "@caab/contracts";
import type { RequestActor } from "../../shared/request-context";
import { requirePermission } from "../../auth/authorize";
import { PERMISSIONS } from "../../auth/permissions";
import {
  auditCorrelationId,
  auditRequestId,
  auditRouteError,
  validateAuditMutation,
} from "./responses";

export function createAuditExportsRoute(deps: {
  resolveActor(request: Request): Promise<RequestActor | null>;
  create(
    command: AuditExportRequest & {
      actor: RequestActor;
      effectiveIdentity: string;
      requestId: string;
      correlationId: string;
      idempotencyKey: string;
    },
  ): Promise<JobReference>;
}) {
  return {
    POST: async (request: Request) => {
      const requestId = auditRequestId(request);
      try {
        const actor = requirePermission(
          (await deps.resolveActor(request)) ?? undefined,
          PERMISSIONS.auditExport,
        );
        const idempotencyKey = validateAuditMutation(request);
        const input = auditExportRequestSchema.parse(await request.json());
        const job = await deps.create({
          ...input,
          actor,
          effectiveIdentity: `user:${actor.userId}`,
          requestId,
          correlationId: auditCorrelationId(request),
          idempotencyKey,
        });
        return Response.json(jobReferenceSchema.parse(job), { status: 202 });
      } catch (error) {
        return auditRouteError(error, requestId);
      }
    },
  };
}
