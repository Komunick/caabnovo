import { reportCatalog, type ReportQuery, type ReportTable } from "@caab/contracts";

/** Same limit as the report contract's `notes` ("Análise da gestão"). */
export const REPORT_EXPORT_NOTES_MAX = 2000;
export const REPORT_EXPORT_NOTES_KEY = "caab:reports-export-notes";
/** A leftover from a navigation that never completed must not leak into a later visit. */
const REPORT_EXPORT_NOTES_TTL_MS = 5 * 60 * 1000;

/**
 * Hands the management comment to the export screen through sessionStorage (same tab and origin):
 * up to 2000 multibyte characters would make the link URL exceed the server's header limit (431).
 * Storage failures (private mode, quota) only mean the comment is typed again on the export screen.
 */
export function stashReportExportNotes(notes: string | undefined): void {
  try {
    const text = (notes ?? "").trim().slice(0, REPORT_EXPORT_NOTES_MAX);
    if (!text) window.sessionStorage.removeItem(REPORT_EXPORT_NOTES_KEY);
    else
      window.sessionStorage.setItem(
        REPORT_EXPORT_NOTES_KEY,
        JSON.stringify({ text, at: Date.now() }),
      );
  } catch {
    // Opening the export screen is never blocked by storage.
  }
}

/** Reads and removes the stashed comment; the stored value is untrusted input. Returns "" if none. */
export function takeReportExportNotes(): string {
  try {
    const raw = window.sessionStorage.getItem(REPORT_EXPORT_NOTES_KEY);
    if (raw === null) return "";
    window.sessionStorage.removeItem(REPORT_EXPORT_NOTES_KEY);
    const stored: unknown = JSON.parse(raw);
    if (typeof stored !== "object" || stored === null) return "";
    const { text, at } = stored as { text?: unknown; at?: unknown };
    if (typeof text !== "string" || typeof at !== "number") return "";
    if (Date.now() - at > REPORT_EXPORT_NOTES_TTL_MS || at > Date.now() + 60_000) return "";
    return text.trim().slice(0, REPORT_EXPORT_NOTES_MAX);
  } catch {
    return "";
  }
}

/**
 * Link from the detailed analysis to its direct export (CAAB-24): carries the applied filters,
 * the visible columns in their order and the sort. The export page validates everything again.
 * The management comment is not part of the URL; see `stashReportExportNotes`.
 */
export function reportExportHref(
  query: ReportQuery,
  columns?: ReportTable["columns"],
  format?: string,
): string {
  const overview = query.view !== "details";
  const selectedColumns =
    columns ??
    (query.groupBy
      ? { group: "Grupo", count: "Quantidade" }
      : Object.fromEntries(
          Object.entries(reportCatalog[query.dataset].columns).filter(
            ([key]) => !query.columns.length || query.columns.includes(key),
          ),
        ));
  const params = new URLSearchParams({
    dataset: overview ? query.view : query.groupBy ? `${query.dataset}Grouped` : query.dataset,
  });
  const entries: [string, string][] = [
    ["dateScope", query.dateScope],
    ["groupBy", query.groupBy],
    ["from", query.from],
    ["to", query.to],
    ["search", query.search],
    ["status", query.status],
    ["category", query.category],
    ["city", query.city],
    ...(query.dataset === "access" || overview
      ? ([
          ["channel", query.channel === "all" ? "" : query.channel],
          ["environment", query.environment],
          ["source", query.source],
        ] as [string, string][])
      : []),
    ["columns", overview ? "" : Object.keys(selectedColumns).join(",")],
    [
      "sort",
      overview
        ? ""
        : query.groupBy
          ? query.sort === query.groupBy
            ? "group"
            : "count"
          : query.sort,
    ],
    ["direction", query.direction],
  ];
  for (const [key, value] of entries) if (value) params.set(key, value);
  if (format && ["xlsx", "csv", "pdf"].includes(format)) params.set("format", format);
  return `/reports/exportar?${params}`;
}
export async function reportRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1/reports${path}`, { ...options, cache: "no-store" });
  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok) {
    const messages: Record<string, string> = {
      PERMISSION_DENIED: "Você não tem permissão para consultar ou exportar esses dados.",
      AUTHENTICATION_REQUIRED: "Sua sessão terminou. Entre novamente.",
      REPORT_QUERY_CONFLICT:
        "Esta consulta mudou. Suas edições foram preservadas. Copie o que deseja manter; use Cancelar edição e abra novamente a consulta para carregar a versão salva.",
      VALIDATION_FAILED: "Confira o período (até 366 dias), os filtros e as colunas selecionadas.",
      REPORT_TOO_LARGE:
        "Esta geração antiga excedeu seu limite. Use Exportar dados para baixar o conjunto completo.",
    };
    throw new Error(
      messages[data.code] ??
        "Não foi possível concluir. Tente novamente; suas edições foram preservadas.",
    );
  }
  return data as T;
}
