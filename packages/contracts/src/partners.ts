import { z } from "zod";

/** Receita Federal: modulo 11, character value = ASCII - 48. */
export function isValidCnpj(value: string): boolean {
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(value) || /^(\d)\1{13}$/.test(value)) return false;
  for (const length of [12, 13]) {
    let sum = 0;
    for (let i = 0; i < length; i++)
      sum += (value.charCodeAt(i) - 48) * (((length - 1 - i) % 8) + 2);
    const remainder = sum % 11;
    if ((remainder < 2 ? 0 : 11 - remainder) !== Number(value[length])) return false;
  }
  return true;
}
const text = (max: number) => z.string().trim().max(max).default("");
const reason = z.string().trim().min(3).max(1000);
const date = z.iso.date();
export const partnerProfileSchema = z.strictObject({
  name: z.string().trim().min(2).max(160),
  legalName: text(160),
  cnpj: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9./-]*$/)
    .transform((value) => value.replace(/[./-]/g, ""))
    .refine((value) => !value || isValidCnpj(value), "CNPJ inválido")
    .default(""),
  category: z.string().trim().min(2).max(80),
  description: text(3000),
  contactName: text(160),
  email: z.union([z.email().max(254), z.literal("")]).default(""),
  phone: text(30),
  website: z.union([z.url({ protocol: /^https?$/ }).max(500), z.literal("")]).default(""),
});
export const partnerUnitSchema = z.strictObject({
  name: z.string().trim().min(2).max(160),
  mode: z.enum(["presential", "remote"]),
  city: text(100),
  state: z.union([z.string().regex(/^[A-Z]{2}$/), z.literal("")]).default(""),
  address: text(300),
  region: text(300),
  phone: text(30),
});
export const partnerContractSchema = z
  .strictObject({
    reference: z.string().trim().min(2).max(160),
    terms: z.string().trim().min(3).max(5000),
    startsOn: date,
    endsOn: date,
    fileId: z.uuid().nullable().default(null),
  })
  .refine((input) => input.startsOn <= input.endsOn, {
    path: ["endsOn"],
    message: "O fim deve ser igual ou posterior ao início.",
  });
const channels = z
  .array(z.enum(["site", "app"]))
  .max(2)
  .refine((values) => new Set(values).size === values.length, "Canais repetidos");
export const benefitDraftSchema = z
  .strictObject({
    title: text(160),
    description: text(3000),
    conditions: text(5000),
    audience: text(1000),
    unitId: z.uuid().nullable().default(null),
    contractId: z.uuid().nullable().default(null),
    startsOn: date.nullable().default(null),
    endsOn: date.nullable().default(null),
    channels: channels.default([]),
  })
  .refine((input) => !input.startsOn || !input.endsOn || input.startsOn <= input.endsOn, {
    path: ["endsOn"],
    message: "O fim deve ser igual ou posterior ao início.",
  });
export const benefitPublicationSchema = benefitDraftSchema.safeExtend({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(3).max(3000),
  conditions: z.string().trim().min(3).max(5000),
  audience: z.string().trim().min(2).max(1000),
  unitId: z.uuid(),
  contractId: z.uuid(),
  startsOn: date,
  endsOn: date,
  channels: channels.min(1),
});
const base = { expectedVersion: z.number().int().positive(), justification: reason };
export const createPartnerSchema = z.strictObject({
  profile: partnerProfileSchema,
  justification: reason,
});
export const partnerCommandSchema = z.discriminatedUnion("action", [
  z.strictObject({ ...base, action: z.literal("update"), profile: partnerProfileSchema }),
  z.strictObject({ ...base, action: z.literal("status"), status: z.enum(["active", "suspended"]) }),
  z.strictObject({ ...base, action: z.literal("archive") }),
  z.strictObject({ ...base, action: z.literal("restore") }),
  z.strictObject({
    ...base,
    action: z.literal("unit"),
    unitId: z.uuid().optional(),
    profile: partnerUnitSchema,
    active: z.boolean(),
  }),
  z.strictObject({ ...base, action: z.literal("contract"), contract: partnerContractSchema }),
  z.strictObject({
    ...base,
    action: z.literal("contract-status"),
    contractId: z.uuid(),
    status: z.enum(["approved", "ended"]),
  }),
  z.strictObject({
    ...base,
    action: z.literal("benefit"),
    benefitId: z.uuid().optional(),
    draft: benefitDraftSchema,
  }),
  z.strictObject({ ...base, action: z.literal("publish"), benefitId: z.uuid() }),
  z.strictObject({ ...base, action: z.literal("hide"), benefitId: z.uuid() }),
]);
export const partnerListSchema = z.strictObject({
  q: text(160),
  category: text(80),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  status: z.enum(["all", "active", "suspended", "archived"]).default("all"),
});
export const benefitListSchema = partnerListSchema.omit({ status: true }).extend({
  status: z.enum(["all", "draft", "visible", "unavailable"]).default("all"),
  channel: z.enum(["all", "site", "app"]).default("all"),
});
export const publicBenefitListSchema = partnerListSchema.omit({ status: true });
export type PartnerProfile = z.infer<typeof partnerProfileSchema>;
export type PartnerUnitProfile = z.infer<typeof partnerUnitSchema>;
export type PartnerCommand = z.infer<typeof partnerCommandSchema>;
export type BenefitDraft = z.infer<typeof benefitDraftSchema>;
export type BenefitPublication = z.infer<typeof benefitPublicationSchema>;
export interface PartnerUnit {
  id: string;
  profile: PartnerUnitProfile;
  active: boolean;
}
export interface PartnerContract extends z.infer<typeof partnerContractSchema> {
  id: string;
  status: "draft" | "approved" | "ended";
  approvedAt: string | null;
  createdAt: string;
}
export interface PartnerBenefit {
  id: string;
  draft: BenefitDraft;
  published: BenefitPublication | null;
  visible: boolean;
}
export interface PartnerRecord {
  id: string;
  profile: PartnerProfile;
  status: "active" | "suspended";
  archivedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  units: PartnerUnit[];
  contracts: PartnerContract[];
  benefits: PartnerBenefit[];
}
export interface PartnerListItem {
  id: string;
  name: string;
  category: string;
  status: "active" | "suspended";
  archivedAt: string | null;
}
export interface BenefitListItem extends PartnerBenefit {
  partnerId: string;
  partnerName: string;
  category: string;
}
export interface PartnerFile {
  id: string;
  name: string;
  status: string;
  scanStatus: string;
  sizeBytes: number;
}
export interface PartnerHistoryItem {
  id: string;
  action: string;
  reason: string;
  actorName: string | null;
  createdAt: string;
  after: Record<string, unknown>;
}
export interface PublicBenefit {
  id: string;
  title: string;
  description: string;
  conditions: string;
  audience: string;
  startsOn: string;
  endsOn: string;
  partner: { name: string; category: string };
  unit: {
    name: string;
    mode: string;
    city: string;
    state: string;
    address: string;
    region: string;
  };
}
