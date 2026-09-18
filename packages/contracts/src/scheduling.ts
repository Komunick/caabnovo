import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";
import { brazilianAddressSchema } from "./brazilian-address";
import { brazilianPhoneSchema } from "./brazilian-contact";

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
  services: z.object({ ...named, unitId: idSchema }).strict(),
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
});
export type SchedulingCatalogItem = z.infer<typeof schedulingCatalogItemSchema>;
export const schedulingPageQuerySchema = z.object({
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
export const schedulingAvailabilitySchema = z.object({
  assignmentId: idSchema,
  date: schedulingDateSchema,
  excludeBookingId: idSchema.optional(),
});
export type SchedulingSlot = { startsAt: string; endsAt: string };
export const schedulingCreateSchema = z
  .object({ memberId: idSchema, assignmentId: idSchema, startsAt: isoDateTimeSchema })
  .strict();
export const schedulingRescheduleSchema = z
  .object({
    assignmentId: idSchema,
    startsAt: isoDateTimeSchema,
    expectedVersion: z.number().int().positive(),
  })
  .strict();
export const schedulingCancelSchema = z
  .object({ expectedVersion: z.number().int().positive() })
  .strict();
export const schedulingBookingsQuerySchema = schedulingPageQuerySchema.extend({
  date: schedulingDateSchema,
  status: z.enum(["scheduled", "cancelled"]).optional(),
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
  assignmentId: idSchema,
  unitId: idSchema,
  unitName: z.string(),
  serviceId: idSchema,
  serviceName: z.string(),
  procedureId: idSchema,
  procedureName: z.string(),
  professionalId: idSchema,
  professionalName: z.string(),
  startsAt: isoDateTimeSchema,
  endsAt: isoDateTimeSchema,
  durationMinutes: z.number().int().positive(),
  status: z.enum(["scheduled", "cancelled"]),
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
  action: "created" | "rescheduled" | "cancelled";
  actorName: string;
  occurredAt: string;
  before: Partial<SchedulingBooking> | null;
  after: Partial<SchedulingBooking>;
};
