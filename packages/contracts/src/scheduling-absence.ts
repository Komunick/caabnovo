import { z } from "zod";
import { idSchema } from "./common";

export const schedulingAbsenceAppealKindSchema = z.enum(["justification", "contestation"]);
export const schedulingAbsenceDecisionOutcomeSchema = z.enum(["accepted", "rejected"]);
export type SchedulingAbsenceAppealKind = z.infer<typeof schedulingAbsenceAppealKindSchema>;
export type SchedulingAbsenceDecisionOutcome = z.infer<
  typeof schedulingAbsenceDecisionOutcomeSchema
>;

// Identity and timestamps come from the authorized command, never from these payloads.
const expectedVersion = z.number().int().positive();
export const schedulingAbsenceRecordSchema = z.object({ expectedVersion }).strict();
export const schedulingAbsenceAppealSchema = z
  .object({
    expectedVersion,
    kind: schedulingAbsenceAppealKindSchema,
    explanation: z.string().trim().min(1, "Explique a justificativa ou contestação."),
    evidenceFileIds: z.array(idSchema).min(1, "Anexe pelo menos um comprovante."),
  })
  .strict();
export const schedulingAbsenceDecisionSchema = z
  .object({ expectedVersion, outcome: schedulingAbsenceDecisionOutcomeSchema })
  .strict();

export type SchedulingAbsenceRecordInput = z.infer<typeof schedulingAbsenceRecordSchema>;
export type SchedulingAbsenceAppealInput = z.infer<typeof schedulingAbsenceAppealSchema>;
export type SchedulingAbsenceDecisionInput = z.infer<typeof schedulingAbsenceDecisionSchema>;

export const schedulingAbsenceStatusSchema = z.enum([
  "awaiting_response",
  "under_review",
  "accepted",
  "rejected",
  "unanswered",
]);
export type SchedulingAbsenceStatus = z.infer<typeof schedulingAbsenceStatusSchema>;
export const schedulingAbsenceStatusLabels: Record<SchedulingAbsenceStatus, string> = {
  awaiting_response: "Prazo para apresentar pedido",
  under_review: "Em análise",
  accepted: "Falta abonada",
  rejected: "Pedido rejeitado",
  unanswered: "Sem pedido no prazo",
};
export const schedulingAbsenceQuerySchema = z
  .object({
    bookingId: idSchema.optional(),
    memberId: idSchema.optional(),
    q: z.string().trim().max(100).default(""),
    status: z.enum(["all", ...schedulingAbsenceStatusSchema.options]).default("all"),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();
export type SchedulingAbsenceQuery = z.infer<typeof schedulingAbsenceQuerySchema>;

/** Safe metadata; explanations and evidence are exclusive to the protected review endpoint. */
export interface SchedulingAbsence {
  id: string;
  bookingId: string;
  memberId: string;
  recordedAt: string;
  recordedByName: string;
  appealDeadline: string;
  restrictionEndsAt: string;
  finalizedAt: string | null;
  version: number;
  status: SchedulingAbsenceStatus;
  appeal: {
    kind: SchedulingAbsenceAppealKind;
    submittedAt: string;
    submittedByName: string;
    outcome: SchedulingAbsenceDecisionOutcome | null;
    decidedAt: string | null;
    decidedByName: string | null;
  } | null;
  restrictionActive: boolean;
  canSubmitAppeal: boolean;
  historyLabel: "Falta abonada" | null;
}
export interface SchedulingAbsenceListItem extends SchedulingAbsence {
  memberName: string;
  unitName: string;
  procedureName: string;
  startsAt: string | null;
  endsAt: string | null;
}
