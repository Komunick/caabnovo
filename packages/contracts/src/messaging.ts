import { z } from "zod";
import { memberGenderSchema } from "./members";
import { idSchema } from "./common";
import { brazilianStateSchema } from "./brazilian-contact";

export const messageKindSchema = z.enum(["campaigns", "templates", "audiences"]);
export type MessageKind = z.infer<typeof messageKindSchema>;
export const messageAudienceSchema = z
  .object({
    state: brazilianStateSchema.or(z.literal("")).default(""),
    residenceState: brazilianStateSchema.or(z.literal("")).default(""),
    category: z.string().trim().max(80).default(""),
    gender: memberGenderSchema.or(z.literal("")).default(""),
    relationship: z.enum(["any", "holder", "dependent"]).default("any"),
    city: z.string().trim().max(120).default(""),
    minAge: z.number().int().min(0).max(150).nullable().default(null),
    maxAge: z.number().int().min(0).max(150).nullable().default(null),
    administrativeStatus: z.enum(["any", "active", "inactive", "blocked"]).default("any"),
    contact: z.enum(["any", "email", "phone"]).default("any"),
    memberIds: z.array(idSchema).default([]),
    excludedIds: z.array(idSchema).default([]),
  })
  .strict()
  .refine(
    (v) =>
      new Set(v.memberIds).size === v.memberIds.length &&
      new Set(v.excludedIds).size === v.excludedIds.length,
    "Pessoas repetidas.",
  )
  .refine(
    (v) => v.minAge === null || v.maxAge === null || v.minAge <= v.maxAge,
    "A idade mínima não pode superar a máxima.",
  );
export type MessageAudience = z.infer<typeof messageAudienceSchema>;
export const messageContentSchema = z
  .object({
    subject: z.string().max(200).default(""),
    body: z.string().max(12000).default(""),
  })
  .strict();
export const messageDataSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    ...messageContentSchema.shape,
    audience: messageAudienceSchema.default(() => messageAudienceSchema.parse({})),
  })
  .strict();
export type MessageData = z.infer<typeof messageDataSchema>;
export const messageSaveSchema = z
  .object({ data: messageDataSchema, expectedVersion: z.number().int().min(0) })
  .strict();
export const messageCommandSchema = z
  .object({
    action: z.enum(["archive", "restore", "duplicate", "send", "schedule", "reschedule", "cancel"]),
    expectedVersion: z.number().int().positive(),
    scheduledAt: z.iso.datetime({ offset: true }).optional(),
  })
  .strict()
  .refine(
    (v) => ["schedule", "reschedule"].includes(v.action) === (v.scheduledAt !== undefined),
    "Data exclusiva da programação.",
  );
export const messagePreviewSchema = z.object({ data: messageDataSchema }).strict();
export const messagePreferenceSchema = z
  .object({
    blocked: z.boolean(),
    reason: z.string().trim().min(3).max(500),
    expectedVersion: z.number().int().min(0),
  })
  .strict();
export const messageQuerySchema = z
  .object({
    q: z.string().trim().max(160).default(""),
    archived: z.enum(["active", "archived", "all"]).default("active"),
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export const messageScheduleQuerySchema = messageQuerySchema
  .extend({
    status: z.enum(["scheduled", "blocked", "canceled", "all"]).default("scheduled"),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, "Período inválido.");
export type MessageSchedule = Omit<MessageExecution, "snapshot"> & {
  name: string;
  currentVersion: number;
};
export type MessageQuery = z.infer<typeof messageQuerySchema>;
export type MessageRecord = {
  lastExecutionStatus?: "scheduled" | "blocked" | "canceled" | null;
  people?: { id: string; name: string }[];
  id: string;
  kind: MessageKind;
  data: MessageData;
  version: number;
  archivedAt: string | null;
  updatedAt: string;
  scheduledAt: string | null;
};
export type MessagePerson = {
  id: string;
  name: string;
  blocked: boolean;
  version: number;
  reason: string;
};
export type MessageExecution = {
  id: string;
  campaignId: string;
  campaignVersion: number;
  snapshot: MessageData;
  status: "scheduled" | "blocked" | "canceled";
  reason: string | null;
  scheduledAt: string;
  createdAt: string;
  completedAt: string | null;
  counts: MessageCounts | null;
};
export type MessageCounts = {
  matched: number;
  excluded: number;
  suppressed: number;
  eligible: number;
};
export type MessagePreview = {
  counts: MessageCounts;
  sample: { id: string; name: string }[];
  subject: string;
  body: string;
  issues: string[];
  channelConfigured: false;
};
export type MessageList<T> = { items: T[]; page: number; total: number; hasNextPage: boolean };

export function messageContentIssues(content: { subject: string; body: string }): string[] {
  const issues: string[] = [];
  if (!content.subject.trim()) issues.push("Informe o assunto.");
  if (!content.body.trim()) issues.push("Escreva a mensagem.");
  const unknown = `${content.subject} ${content.body}`.replace(/\{\{(nome|primeiro_nome)\}\}/g, "");
  if (unknown.includes("{{") || unknown.includes("}}"))
    issues.push("Use apenas {{nome}} e {{primeiro_nome}} para personalizar.");
  return issues;
}
export function personalizeMessage(text: string, name: string) {
  return text.replace(/\{\{(nome|primeiro_nome)\}\}/g, (_, key: string) =>
    key === "nome" ? name : (name.trim().split(/\s+/)[0] ?? name),
  );
}
