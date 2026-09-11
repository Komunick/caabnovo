import { z } from "zod";

export const oabNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{1,6}$/)
  .refine((value) => /[1-9]/.test(value));
export const oabLookupInputSchema = z.union([
  z.strictObject({ number: oabNumberSchema, state: z.literal("BA") }),
  z.strictObject({ memberId: z.uuid() }),
]);
export type OabLookupInput = z.infer<typeof oabLookupInputSchema>;
export interface OabLookupResult {
  lookupId: string;
  number: string;
  state: "BA";
  source: "OAB-BA / Implanta";
  checkedAt: string;
  status: "regular" | "irregular" | "unknown" | "not_found";
  name: string | null;
}
