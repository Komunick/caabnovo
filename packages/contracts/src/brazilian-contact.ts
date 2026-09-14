import { z } from "zod";
export const brazilianStateCodes = [
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
] as const;
export const brazilianStateSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.union([z.enum(brazilianStateCodes), z.literal("")]))
  .default("");
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^(?:\d{5}-?\d{3})?$/)
  .transform((value) => value.replace(/-/g, ""))
  .default("");
export const brazilianPhoneSchema = z
  .string()
  .trim()
  .regex(/^[\d ()-]*$/)
  .transform((value) => value.replace(/\D/g, ""))
  .refine(
    (value) => !value || /^[1-9]{2}\d{8,9}$/.test(value),
    "Informe DDD e telefone com oito ou nove dígitos.",
  )
  .default("");
export const requiredEmailSchema = z.string().trim().pipe(z.email().max(254));
export const contactEmailSchema = z.union([requiredEmailSchema, z.literal("")]).default("");
export const contactWebsiteSchema = z
  .string()
  .trim()
  .pipe(
    z.union([z.url({ protocol: /^https?$/, hostname: z.regexes.domain }).max(500), z.literal("")]),
  )
  .default("");
export const contactFieldMessages = {
  phone: "Informe um telefone válido: DDD + oito dígitos (fixo) ou nove (celular).",
  email: "Informe um e-mail válido, como nome@exemplo.com.",
  website: "Informe um site válido com http:// ou https://, como https://exemplo.com.br.",
  cnpj: "Informe um CNPJ válido, numérico ou alfanumérico, com 14 posições.",
  postalCode: "Informe um CEP com oito dígitos.",
  state: "Escolha uma UF válida na lista.",
};
