import { z } from "zod";
import {
  idSchema,
  isoDateTimeSchema,
  nonEmptyReasonSchema,
  pageSchema,
  paginationQuerySchema,
} from "./common";

const actionSchema = z.string().trim().min(1).max(120);
const entityTypeSchema = z.string().trim().min(1).max(80);
const snapshotSchema = z.record(z.string(), z.unknown());

export const auditEventSchema = z.object({
  id: idSchema,
  occurredAt: isoDateTimeSchema,
  actorUserId: idSchema.nullable(),
  action: actionSchema,
  entityType: entityTypeSchema,
  entityId: z.string().min(1).max(256),
  before: snapshotSchema.nullable(),
  after: snapshotSchema.nullable(),
  reason: z.string().nullable(),
  origin: z.enum(["web", "worker", "system"]),
  requestId: idSchema,
  correlationId: idSchema,
});

export const auditPageSchema = pageSchema(auditEventSchema);

const auditFilterSchema = z.object({
  actorId: idSchema.optional(),
  action: actionSchema.optional(),
  entityType: entityTypeSchema.optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
});

function orderedPeriod(value: { from?: string; to?: string }) {
  return !value.from || !value.to || Date.parse(value.from) <= Date.parse(value.to);
}

export const auditListQuerySchema = paginationQuerySchema
  .extend(auditFilterSchema.shape)
  .refine(orderedPeriod, { path: ["to"], message: "End date must not precede start date" });

export const auditExportRequestSchema = auditFilterSchema
  .required({ from: true, to: true })
  .extend({ justification: nonEmptyReasonSchema })
  .refine(orderedPeriod, { path: ["to"], message: "End date must not precede start date" });

export const auditExportJobPayloadSchema = auditFilterSchema
  .required({ from: true, to: true })
  .extend({
    schemaVersion: z.literal(1),
    jobId: idSchema,
    correlationId: idSchema,
    requestId: idSchema,
    requestedBy: idSchema,
  })
  .refine(orderedPeriod, { path: ["to"], message: "End date must not precede start date" });

export type AuditEvent = z.infer<typeof auditEventSchema>;
export type AuditPage = z.infer<typeof auditPageSchema>;
export type AuditListQuery = z.infer<typeof auditListQuerySchema>;
export type AuditExportRequest = z.infer<typeof auditExportRequestSchema>;
export type AuditExportJobPayload = z.infer<typeof auditExportJobPayloadSchema>;
