import { z } from "zod";

export function isValidCpf(value: string): boolean {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(value[i]) * (length + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(value[length])) return false;
  }
  return true;
}

const optionalText = (max: number) => z.string().trim().max(max).default("");
const date = z.iso.date();
const reason = z.string().trim().min(3).max(1000);
const uuid = z.uuid();
export const memberProfileSchema = z.strictObject({
  name: z.string().trim().min(2).max(160),
  socialName: optionalText(160),
  cpf: z
    .string()
    .trim()
    .regex(/^[\d.-]*$/)
    .transform((s) => s.replace(/[.-]/g, ""))
    .refine((s) => !s || isValidCpf(s), "CPF inválido")
    .default(""),
  birthDate: date
    .nullable()
    .default(null)
    .refine((s) => !s || s <= new Date().toISOString().slice(0, 10), "Nascimento futuro"),
  email: z.union([z.email().max(254), z.literal("")]).default(""),
  phone: optionalText(30),
  oab: z
    .strictObject({
      number: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9-]{1,20}$/),
      state: z.enum([
        "AC",
        "AL",
        "AP",
        "AM",
        "BA",
        "CE",
        "DF",
        "ES",
        "GO",
        "MA",
        "MT",
        "MS",
        "MG",
        "PA",
        "PB",
        "PR",
        "PE",
        "PI",
        "RJ",
        "RN",
        "RS",
        "RO",
        "RR",
        "SC",
        "SP",
        "SE",
        "TO",
      ]),
      type: z.enum(["lawyer", "trainee", "supplementary"]),
    })
    .nullable()
    .default(null),
});
export const createMemberSchema = z.strictObject({
  profile: memberProfileSchema,
  justification: reason,
});
export const memberDimensions = {
  registration: ["unknown", "pending", "approved", "rejected"],
  membership: ["unknown", "active", "suspended", "ended"],
  oab: ["unknown", "regular", "irregular", "unavailable"],
  financial: ["unknown", "regular", "irregular"],
  credential: ["unknown", "valid", "revoked"],
  eligibility: ["unknown", "eligible", "ineligible"],
} as const;
export type MemberDimension = keyof typeof memberDimensions;
const base = { expectedVersion: z.number().int().positive(), justification: reason };
export const memberCommandSchema = z
  .discriminatedUnion("action", [
    z.strictObject({ ...base, action: z.literal("update"), profile: memberProfileSchema }),
    z.strictObject({ ...base, action: z.literal("archive") }),
    z.strictObject({ ...base, action: z.literal("restore") }),
    z.strictObject({
      ...base,
      action: z.literal("link"),
      dependentId: uuid,
      relationship: z.string().trim().min(2).max(80),
      startsOn: date,
    }),
    z.strictObject({ ...base, action: z.literal("unlink"), relationshipId: uuid }),
    z.strictObject({
      ...base,
      action: z.literal("document"),
      fileId: uuid,
      category: z.string().trim().min(2).max(80),
      replacesId: uuid.nullable().default(null),
    }),
    z.strictObject({
      ...base,
      action: z.literal("review"),
      documentId: uuid,
      result: z.enum(["accepted", "correction_requested"]),
    }),
    z.strictObject({
      ...base,
      action: z.literal("assess"),
      dimension: z.enum(Object.keys(memberDimensions) as [MemberDimension, ...MemberDimension[]]),
      result: z.string().max(30),
      source: z.string().trim().min(3).max(300),
      observedAt: z.iso.datetime({ offset: true }),
      validUntil: z.iso.datetime({ offset: true }).nullable().default(null),
    }),
  ])
  .superRefine((input, ctx) => {
    if (input.action === "link" && input.startsOn > new Date().toISOString().slice(0, 10))
      ctx.addIssue({ code: "custom", path: ["startsOn"], message: "Início futuro" });
    if (input.action !== "assess") return;
    if (!(memberDimensions[input.dimension] as readonly string[]).includes(input.result))
      ctx.addIssue({ code: "custom", path: ["result"], message: "Resultado incompatível" });
    if (Date.parse(input.observedAt) > Date.now())
      ctx.addIssue({ code: "custom", path: ["observedAt"], message: "Consulta futura" });
    if (input.validUntil && Date.parse(input.validUntil) <= Date.parse(input.observedAt))
      ctx.addIssue({
        code: "custom",
        path: ["validUntil"],
        message: "Validade anterior à consulta",
      });
    if (input.dimension === "credential" && input.result === "valid" && !input.validUntil)
      ctx.addIssue({ code: "custom", path: ["validUntil"], message: "Validade obrigatória" });
  });
export const memberListSchema = z.strictObject({
  q: z.string().trim().max(160).default(""),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  archived: z.enum(["active", "archived", "all"]).default("active"),
  registrationStatus: z.enum(memberDimensions.registration).optional(),
  oabState: memberProfileSchema.shape.oab.unwrap().unwrap().shape.state.optional(),
});
export type MemberProfile = z.infer<typeof memberProfileSchema>;
export type MemberCommand = z.infer<typeof memberCommandSchema>;
export interface MemberAssessment {
  id: string;
  dimension: MemberDimension;
  result: string;
  source: string;
  reason: string;
  observedAt: string;
  validUntil: string | null;
  createdAt: string;
  actorName: string;
  expired: boolean;
  profileChanged: boolean;
}
export interface MemberDocument {
  id: string;
  fileId: string;
  category: string;
  replacesId: string | null;
  createdAt: string;
  result: "pending" | "accepted" | "correction_requested";
  reason: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviews: { id: string; result: string; reason: string; actorName: string; createdAt: string }[];
}
export interface MemberRelationship {
  id: string;
  holderId: string;
  dependentId: string;
  holderName: string;
  dependentName: string;
  relationship: string;
  startsOn: string;
  endedAt: string | null;
}
export interface MemberRecord {
  id: string;
  profile: MemberProfile;
  version: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assessments: MemberAssessment[];
  documents: MemberDocument[];
  relationships: MemberRelationship[];
}
export interface MemberListItem {
  id: string;
  name: string;
  registrationStatus: string;
  archivedAt: string | null;
}
export interface MemberFile {
  id: string;
  name: string;
  status: string;
  scanStatus: string;
  sizeBytes: number;
}
