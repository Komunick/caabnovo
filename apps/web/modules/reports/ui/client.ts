import type { ReportQuery } from "@caab/contracts";

/**
 * Link from the detailed analysis to its direct export (CAAB-24): carries the applied filters,
 * the visible columns in their order and the sort. The export page validates everything again.
 */
export function reportExportHref(query: ReportQuery): string {
  const params = new URLSearchParams({ dataset: query.dataset });
  const entries: [string, string][] = [
    ["dateScope", query.dateScope],
    ["from", query.from],
    ["to", query.to],
    ["search", query.search],
    ["status", query.status],
    ["category", query.category],
    ["city", query.city],
    ...(query.dataset === "access"
      ? ([
          ["channel", query.channel === "all" ? "" : query.channel],
          ["environment", query.environment],
          ["source", query.source],
        ] as [string, string][])
      : []),
    ["columns", query.columns.join(",")],
    ["sort", query.sort],
    ["direction", query.direction],
  ];
  for (const [key, value] of entries) if (value) params.set(key, value);
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
        "Este arquivo passa de 50 mil linhas. Para baixar tudo, use Exportar dados na análise detalhada sem agrupamento.",
    };
    throw new Error(
      messages[data.code] ??
        "Não foi possível concluir. Tente novamente; suas edições foram preservadas.",
    );
  }
  return data as T;
}
