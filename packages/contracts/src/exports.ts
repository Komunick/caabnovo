import { z } from "zod";

export const exportFormatSchema = z.enum(["xlsx", "csv", "pdf"]);
export const exportModuleSchema = z.enum([
  "users",
  "members",
  "partners",
  "news",
  "scheduling",
  "messages",
  "audit",
  "reports",
]);
const key = z.string().regex(/^[a-z][a-zA-Z0-9_]*$/);
const scalar = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
export const exportRequestSchema = z
  .object({
    module: exportModuleSchema,
    dataset: key,
    filters: z.record(key, z.union([scalar, z.array(scalar)])).default({}),
    sort: z
      .array(z.object({ field: key, direction: z.enum(["asc", "desc"]) }).strict())
      .default([])
      .refine((sort) => new Set(sort.map((entry) => entry.field)).size === sort.length),
    columns: z
      .array(key)
      .min(1)
      .refine((columns) => new Set(columns).size === columns.length),
    format: exportFormatSchema,
    context: z
      .object({ recordId: z.uuid().optional(), source: z.literal("reports").optional() })
      .strict()
      .optional(),
  })
  .strict();
export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
export type ExportModule = z.infer<typeof exportModuleSchema>;
export type ExportScalar = z.infer<typeof scalar>;
export type ExportColumn = {
  key: string;
  label: string;
  scalarType: "text" | "number" | "boolean" | "date";
  defaultSelected: boolean;
  sortable: boolean;
  permission?: string;
};
export type ExportFilter = {
  key: string;
  label: string;
  type: "text" | "date" | "choice";
  options?: { value: string; label: string }[];
  permission?: string;
};
export type ExportCatalog = {
  module: ExportModule;
  dataset: string;
  label: string;
  columns: ExportColumn[];
  filters: ExportFilter[];
  formats: ExportFormat[];
  csrfToken: string;
  timezone: string;
};
export const exportPhaseSchema = z.enum([
  "preparing",
  "streaming",
  "completed",
  "failed",
  "cancelled",
  "interrupted",
]);
export type ExportPhase = z.infer<typeof exportPhaseSchema>;
export type ExportOperation = {
  requestId: string;
  phase: ExportPhase;
  rowCount: number;
  byteCount: number;
  errorCode: string | null;
};

/** Catalog is already restricted to the actor. Reject the entire request on any mismatch. */
export function validateExportSelection(
  input: ExportRequest,
  catalog: {
    columns: Pick<ExportColumn, "key" | "sortable">[];
    filters: Pick<ExportFilter, "key" | "type" | "options">[];
  },
) {
  const invalid = () => {
    throw new Error("EXPORT_CONFIGURATION_INVALID");
  };
  const columns = new Map(catalog.columns.map((column) => [column.key, column]));
  if (
    input.columns.some((column) => !columns.has(column)) ||
    input.sort.some((sort) => !columns.get(sort.field)?.sortable)
  )
    invalid();
  const filters = new Map(catalog.filters.map((filter) => [filter.key, filter]));
  for (const [key, value] of Object.entries(input.filters)) {
    const filter = filters.get(key);
    if (!filter || typeof value !== "string") {
      invalid();
      continue;
    }
    if (filter.type === "date" && value !== "" && !z.iso.date().safeParse(value).success) invalid();
    if (
      filter.type === "choice" &&
      value !== "" &&
      !filter.options?.some((option) => option.value === value)
    )
      invalid();
  }
  const { from, to } = input.filters;
  if (typeof from === "string" && typeof to === "string" && from && to && from > to) invalid();
  return input;
}
