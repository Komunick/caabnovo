import { reportCatalog, type ReportQuery, type ReportTable } from "@caab/contracts";

import type { useDraftCache } from "@/components/workspace-drafts";

/** Same limit as the report contract's `notes` ("Análise da gestão"). */
export const REPORT_EXPORT_NOTES_MAX = 2000;
export const REPORT_EXPORT_NOTES_KEY = "reports:export-pending-notes";
const LEGACY_REPORT_EXPORT_NOTES_KEY = "caab:reports-export-notes";
const REPORT_EXPORT_NOTES_TTL_MS = 5 * 60 * 1000;
type NotesCache = Pick<ReturnType<typeof useDraftCache>, "writeForRoute" | "read" | "remove">;

/** Discard the old global transport without ever trusting or displaying its contents. */
export function clearLegacyReportExportNotes(): void {
  try {
    window.sessionStorage.removeItem(LEGACY_REPORT_EXPORT_NOTES_KEY);
  } catch {
    // Private mode/storage failures do not affect the authenticated in-memory draft.
  }
}
const selection = (href: string) => {
  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.sort();
  return `${pathname}?${params}`;
};

/** Hand the comment to this selection within the authenticated workspace, never browser storage. */
export function stashReportExportNotes(
  cache: NotesCache,
  notes: string | undefined,
  href: string,
): void {
  clearLegacyReportExportNotes();
  cache.writeForRoute("/reports/exportar", REPORT_EXPORT_NOTES_KEY, {
    text: (notes ?? "").trim().slice(0, REPORT_EXPORT_NOTES_MAX),
    at: Date.now(),
    selection: selection(href),
  });
}

/** Consume once, including denied/mismatched destinations; validate the pending value defensively. */
export function takeReportExportNotes(cache: NotesCache, href: string): string {
  clearLegacyReportExportNotes();
  const stored = cache.read(REPORT_EXPORT_NOTES_KEY);
  cache.remove(REPORT_EXPORT_NOTES_KEY);
  if (typeof stored !== "object" || stored === null) return "";
  const {
    text,
    at,
    selection: target,
  } = stored as { text?: unknown; at?: unknown; selection?: unknown };
  if (typeof text !== "string" || typeof at !== "number" || !Number.isFinite(at)) return "";
  if (Date.now() - at > REPORT_EXPORT_NOTES_TTL_MS || at > Date.now() + 60_000) return "";
  if (target !== selection(href)) return "";
  return text.trim().slice(0, REPORT_EXPORT_NOTES_MAX);
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
