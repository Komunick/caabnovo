const messages: Record<string, string> = {
  ROLE_GRANT_DENIED: "Você não tem permissão para conceder funções.",
  PERMISSION_DENIED: "Você não tem permissão para realizar esta ação.",
  GRANT_BEYOND_AUTHORITY: "Esta função contém permissões que você não pode conceder.",
  SELF_ESCALATION_DENIED:
    "Você não pode conceder funções à própria conta. Solicite a outro administrador.",
  ROLE_ALREADY_ASSIGNED: "Este colaborador já possui esta função. Atualize a página para conferir.",
  USER_NOT_FOUND: "O colaborador não foi encontrado ou está desativado.",
  ROLE_NOT_FOUND: "Esta função não está mais disponível. Atualize a página.",
  JUSTIFICATION_REQUIRED: "Informe uma justificativa para conceder a função.",
  VALIDATION_FAILED: "Confira a função selecionada e preencha a justificativa.",
  AUTHENTICATION_REQUIRED: "Sua sessão expirou. Entre novamente para continuar.",
};

export function roleGrantError(code: unknown): string {
  return typeof code === "string" && Object.hasOwn(messages, code)
    ? messages[code]!
    : "Não foi possível conceder a função. Tente novamente.";
}
