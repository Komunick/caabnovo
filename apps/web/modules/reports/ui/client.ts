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
        "O relatório excede 50 mil linhas. Refine o período ou agrupe os resultados.",
    };
    throw new Error(
      messages[data.error?.code] ??
        "Não foi possível concluir. Tente novamente; suas edições foram preservadas.",
    );
  }
  return data as T;
}
