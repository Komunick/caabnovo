import { z } from "zod";
import type { PartnerUnit } from "./partners";

const reason = z.string().trim().min(3).max(1000);
const version = z.number().int().positive();
export const categoryCommandSchema = z
  .strictObject({
    id: z.uuid().optional(),
    expectedVersion: version.optional(),
    name: z.string().trim().min(2).max(80),
    active: z.boolean().default(true),
    justification: reason,
  })
  .refine((value) => !value.id || value.expectedVersion !== undefined, {
    path: ["expectedVersion"],
  });
export const partnerAppSettingsSchema = z.strictObject({
  expectedVersion: version,
  mode: z.enum(["all", "selected"]),
  categoryIds: z
    .array(z.uuid())
    .max(10000)
    .refine((ids) => new Set(ids).size === ids.length),
  justification: reason,
});
export const partnerUnitListSchema = z.strictObject({
  q: z.string().trim().max(160).default(""),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const partnerReviewListSchema = z.strictObject({
  status: z.enum(["all", "pending", "published", "hidden"]).default("all"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const moderatePartnerReviewSchema = z.strictObject({
  expectedVersion: version,
  status: z.enum(["published", "hidden"]),
  justification: reason,
});
/** Input for a future trusted app adapter; never accept author identity from an anonymous request. */
export const receivedPartnerReviewSchema = z.strictObject({
  sourceId: z.string().trim().min(1).max(200),
  partnerId: z.uuid(),
  benefitId: z.uuid().nullable().default(null),
  authorReference: z.string().trim().min(1).max(200),
  authorLabel: z.string().trim().min(1).max(160),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(5000),
  submittedAt: z.iso.datetime({ offset: true }),
});
export interface PartnerCategory {
  id: string;
  name: string;
  active: boolean;
  version: number;
  partnerCount: number;
}
export interface PartnerAppSettings {
  version: number;
  mode: "all" | "selected";
  categoryIds: string[];
}
export interface PartnerUnitListItem extends PartnerUnit {
  partnerId: string;
  partnerName: string;
  partnerStatus: string;
  partnerArchived: boolean;
}
export interface PartnerReview {
  id: string;
  partnerId: string;
  benefitId: string | null;
  authorLabel: string;
  rating: number;
  comment: string;
  submittedAt: string;
  status: "pending" | "published" | "hidden";
  version: number;
  moderationReason: string | null;
  moderatedAt: string | null;
}
