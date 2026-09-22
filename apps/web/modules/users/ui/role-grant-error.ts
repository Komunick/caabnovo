const messages: Record<string, string> = {
  ROLE_PROMOTION_CONFLICT: "O cargo mudou ou expirou. Atualize a página antes de promover.",
  ROLE_PROMOTION_UNAVAILABLE: "Este cargo não possui uma promoção disponível.",
  ROLE_GRANT_DENIED: "Você não tem permissão para conceder funções.",
  PERMISSION_DENIED: "Você não tem permissão para realizar esta ação.",
  GRANT_BEYOND_AUTHORITY: "Esta função contém permissões que você não pode conceder.",
  SELF_ESCALATION_DENIED:
    "Você não pode conceder funções à própria conta. Solicite a outro administrador.",
  ROLE_ALREADY_ASSIGNED: "Este colaborador já possui esta função. Atualize a página para conferir.",
  USER_ROLE_CONFLICT:
    "Este colaborador já possui um cargo. Atualize a página e revogue o cargo atual antes de conceder outro.",
  USER_NOT_FOUND: "O colaborador não foi encontrado ou está desativado.",
  ROLE_NOT_FOUND: "Esta função não está mais disponível. Atualize a página.",
  VALIDATION_FAILED: "Confira a função selecionada.",
  AUTHENTICATION_REQUIRED: "Sua sessão expirou. Entre novamente para continuar.",
};

export function roleGrantError(code: unknown): string {
  return typeof code === "string" && Object.hasOwn(messages, code)
    ? messages[code]!
    : "Não foi possível conceder a função. Tente novamente.";
}
