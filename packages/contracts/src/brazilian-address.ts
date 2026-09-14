import { z } from "zod";
import { brazilianStateSchema, postalCodeSchema } from "./brazilian-contact";

export const brazilianAddressSchema = z.object({
  postalCode: postalCodeSchema,
  street: z.string().trim().max(300).default(""),
  neighborhood: z.string().trim().max(100).default(""),
  number: z.string().trim().max(20).default(""),
  complement: z.string().trim().max(150).default(""),
  city: z.string().trim().max(100).default(""),
  state: brazilianStateSchema,
  // Retained for old records and clients. Never guess how to split existing text.
  address: z.string().trim().max(600).default(""),
});
export type BrazilianAddress = z.infer<typeof brazilianAddressSchema>;
export function formatBrazilianAddress(value: Partial<BrazilianAddress>): string {
  const parts = [value.street, value.number, value.complement, value.neighborhood]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : (value.address ?? "");
}
