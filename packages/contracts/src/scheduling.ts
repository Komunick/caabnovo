import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";
import { brazilianAddressSchema } from "./brazilian-address";
import { brazilianPhoneSchema } from "./brazilian-contact";
import { schedulingPolicySchema } from "./scheduling-policy";

export const schedulingKinds = [
  "units",
  "services",
  "procedures",
  "professionals",
  "assignments",
] as const;
export const schedulingKindSchema = z.enum(schedulingKinds);
export type SchedulingKind = z.infer<typeof schedulingKindSchema>;
const editable = {
  active: z.boolean().default(true),
  expectedVersion: z.number().int().positive().optional(),
};
const named = { ...editable, name: z.string().trim().min(2).max(160) };
export const schedulingCatalogSchemas = {
  units: z
    .object({
      ...named,
      address: brazilianAddressSchema.optional(),
      phone: brazilianPhoneSchema.optional(),
    })
    .strict(),
  services: z
    .object({
      ...named,
      unitId: idSchema,
      publish: z.boolean().optional(),
      policy: schedulingPolicySchema.optional(),
      initialProcedure: z
        .object({
          name: z.string().trim().min(2).max(160),
          durationMinutes: z.number().int().min(1).max(1440),
          professionalId: idSchema.optional(),
          hours: z
            .array(
              z
                .object({
                  weekday: z.number().int().min(0).max(6),
                  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
                  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
                })
                .strict()
                .refine((row) => row.start < row.end),
            )
            .max(7)
            .optional(),
        })
        .strict()
        .optional(),
    })
    .strict(),
  procedures: z
    .object({
      ...named,
      serviceId: idSchema,
      description: z.string().trim().max(1000).default(""),
      durationMinutes: z.number().int().min(1).max(1440),
    })
    .strict(),
  professionals: z.object(named).strict(),
  assignments: z
    .object({ ...editable, unitId: idSchema, procedureId: idSchema, professionalId: idSchema })
    .strict(),
};
export const schedulingCatalogItemSchema = z.object({
  id: idSchema,
  name: z.string(),
  active: z.boolean(),
  version: z.number().int(),
  unitId: idSchema.optional(),
  serviceId: idSchema.optional(),
  procedureId: idSchema.optional(),
  professionalId: idSchema.optional(),
  durationMinutes: z.number().optional(),
  description: z.string().optional(),
  address: brazilianAddressSchema.optional(),
  phone: z.string().optional(),
  unitName: z.string().optional(),
  serviceName: z.string().optional(),
  procedureName: z.string().optional(),
  professionalName: z.string().optional(),
  policy: schedulingPolicySchema.optional(),
  publishedAt: isoDateTimeSchema.nullable().optional(),
});
export type SchedulingCatalogItem = z.infer<typeof schedulingCatalogItemSchema>;
export const schedulingPageQuerySchema = z.object({
  catalogView: z.enum(["management", "booking"]).optional(),
  beneficiaryId: idSchema.optional(),
  holderId: idSchema.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(160).default(""),
  unitId: idSchema.optional(),
  serviceId: idSchema.optional(),
  procedureId: idSchema.optional(),
  professionalId: idSchema.optional(),
  active: z.enum(["true", "false"]).optional(),
});
export type SchedulingPage<T> = { items: T[]; page: number; pageSize: number; total: number };
export const schedulingDateSchema = z.iso
  .date()
  .refine((value) => value >= "1900-01-01", "Invalid date");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const schedulingHoursRowSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    start: time,
    end: time,
    lunchStart: time.nullable().default(null),
    lunchEnd: time.nullable().default(null),
  })
  .strict()
  .superRefine((row, ctx) => {
    if (row.start >= row.end)
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "O fim deve ser posterior ao início, no mesmo dia.",
      });
    if (
      (row.lunchStart === null) !== (row.lunchEnd === null) ||
      (row.lunchStart &&
        row.lunchEnd &&
        (row.lunchStart < row.start || row.lunchEnd > row.end || row.lunchStart >= row.lunchEnd))
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["lunchEnd"],
        message: "Informe o almoço completo dentro da jornada.",
      });
    }
  });
export type SchedulingHoursRow = z.infer<typeof schedulingHoursRowSchema>;
export const schedulingHoursSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    unitId: idSchema.optional(),
    rows: z.array(schedulingHoursRowSchema).max(7),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (new Set(value.rows.map((row) => row.weekday)).size !== value.rows.length)
      ctx.addIssue({ code: "custom", path: ["rows"], message: "Use uma faixa por dia." });
  });
export const schedulingAvailabilitySchema = z
  .object({
    assignmentId: idSchema.optional(),
    procedureId: idSchema.optional(),
    date: schedulingDateSchema,
    beneficiaryId: idSchema.optional(),
    excludeBookingId: idSchema.optional(),
  })
  .refine((value) => !!value.assignmentId || !!value.procedureId, {
    message: "Selecione o procedimento.",
  });
export type SchedulingSlot = {
  startsAt: string;
  endsAt: string;
  assignmentId?: string | null;
  professionalName?: string | null;
};
export const schedulingCreateSchema = z
  .object({
    memberId: idSchema,
    assignmentId: idSchema.optional(),
    procedureId: idSchema.optional(),
    startsAt: isoDateTimeSchema,
  })
  .strict()
  .refine((value) => !!value.assignmentId || !!value.procedureId, {
    message: "Selecione o procedimento.",
  });
export const schedulingRescheduleSchema = z
  .object({
    assignmentId: idSchema.optional(),
    procedureId: idSchema.optional(),
    startsAt: isoDateTimeSchema,
    expectedVersion: z.number().int().positive(),
  })
  .strict()
  .refine((value) => !!value.assignmentId || !!value.procedureId, {
    message: "Selecione o procedimento.",
  });
export const schedulingPendingEditSchema = z
  .object({
    assignmentId: idSchema.optional(),
    procedureId: idSchema.optional(),
    memberId: idSchema.optional(),
    startsAt: isoDateTimeSchema,
    expectedVersion: z.number().int().positive(),
  })
  .strict();
export const schedulingCancelSchema = z
  .object({ expectedVersion: z.number().int().positive() })
  .strict();
export const schedulingKeepDeletedMemberSchema = z
  .object({ expectedVersion: z.number().int().positive(), deletionEffectiveAt: isoDateTimeSchema })
  .strict();
export const schedulingStatusSchema = z.enum([
  "scheduled",
  "pending_approval",
  "cancelled",
  "rejected",
  "awaiting_new_time",
]);
export const schedulingStatusLabels = {
  scheduled: "Agendado",
  pending_approval: "Aguardando aprovação",
  cancelled: "Cancelado",
  rejected: "Recusado",
  awaiting_new_time: "Aguardando nova data",
} as const;
export const schedulingBookingsQuerySchema = schedulingPageQuerySchema.extend({
  date: schedulingDateSchema,
  status: schedulingStatusSchema.optional(),
  memberId: idSchema.optional(),
});
export const schedulingCalendarQuerySchema = schedulingBookingsQuerySchema
  .pick({ q: true, unitId: true, professionalId: true, status: true })
  .extend({ start: schedulingDateSchema, end: schedulingDateSchema })
  .refine(
    ({ start, end }) => {
      const days = (Date.parse(end) - Date.parse(start)) / 86400000;
      return days > 0 && days <= 42;
    },
    { path: ["end"], message: "Escolha um intervalo de até 42 dias, com fim posterior ao início." },
  );
export const schedulingBookingSchema = z.object({
  id: idSchema,
  memberId: idSchema,
  memberName: z.string(),
  eligibilityWarning: z.literal("blocked").nullable().default(null),
  memberDeletionEffectiveAt: isoDateTimeSchema.nullable().optional(),
  memberDeleted: z.boolean().optional(),
  keptAfterMemberDeletion: z.boolean().optional(),
  memberDeletionKeptAt: isoDateTimeSchema.nullable().optional(),
  memberDeletionKeptBy: z.string().nullable().optional(),
  assignmentId: idSchema.nullable(),
  unitId: idSchema,
  unitName: z.string(),
  serviceId: idSchema,
  serviceName: z.string(),
  procedureId: idSchema,
  procedureName: z.string(),
  professionalId: idSchema.nullable(),
  professionalName: z.string().nullable(),
  startsAt: isoDateTimeSchema.nullable(),
  endsAt: isoDateTimeSchema.nullable(),
  durationMinutes: z.number().int().positive(),
  status: schedulingStatusSchema,
  mode: z.enum(["professional", "capacity"]).optional(),
  confirmedReschedules: z.number().int().nullable().optional(),
  reservedReschedule: z.boolean().optional(),
  processKind: z.enum(["voluntary", "recovery"]).nullable().optional(),
  originalStart: isoDateTimeSchema.nullable().optional(),
  enteredReviewAt: isoDateTimeSchema.nullable().optional(),
  immediateConfirmation: z.boolean().optional(),
  version: z.number().int().positive(),
});
export type SchedulingBooking = z.infer<typeof schedulingBookingSchema>;
export type SchedulingBeneficiary = {
  id: string;
  name: string;
  birthYear: number | null;
  oabNumber: string | null;
  oabState: string | null;
};
export type SchedulingEvent = {
  id: string;
  notifications?: Array<{
    kind: "confirmed" | "rejected" | "cancelled" | "reschedule_required";
    status: "pending" | "suppressed" | "delivered" | "failed" | "uncertain";
  }>;
  action:
    | "created"
    | "rescheduled"
    | "cancelled"
    | "kept_after_member_deletion"
    | "pending_edited"
    | "transferred"
    | "approved"
    | "rejected"
    | "reschedule_requested"
    | "proposal_withdrawn"
    | "resumed"
    | "provider_unavailable";
  actorName: string;
  occurredAt: string;
  before: Partial<SchedulingBooking> | null;
  after: Partial<SchedulingBooking>;
};
