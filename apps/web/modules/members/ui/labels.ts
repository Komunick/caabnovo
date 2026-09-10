export const dimensionLabels: Record<string, string> = {
  registration: "Análise cadastral",
  membership: "Vínculo institucional",
  oab: "Verificação OAB",
  financial: "Situação financeira",
  credential: "Credencial",
  eligibility: "Elegibilidade",
};
export const resultLabels: Record<string, string> = {
  unknown: "Não avaliada",
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Recusado",
  active: "Ativo",
  suspended: "Suspenso",
  ended: "Encerrado",
  regular: "Regular",
  irregular: "Irregular",
  unavailable: "Consulta indisponível",
  valid: "Válida",
  revoked: "Revogada",
  eligible: "Elegível",
  ineligible: "Não elegível",
  accepted: "Aceito",
  correction_requested: "Correção solicitada",
};
export const actionLabels: Record<string, string> = {
  created: "Cadastro criado",
  update: "Cadastro corrigido",
  archive: "Cadastro arquivado",
  restore: "Cadastro restaurado",
  link: "Dependente vinculado",
  unlink: "Vínculo encerrado",
  document: "Documento anexado",
  review: "Documento analisado",
  assess: "Situação avaliada",
};
export function formatMemberDate(value: string | null, dateOnly = false) {
  if (!value) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(dateOnly ? {} : { timeStyle: "short" as const }),
    timeZone: dateOnly ? "UTC" : "America/Bahia",
  }).format(new Date(value));
}
export const memberErrors: Record<string, string> = {
  MEMBER_DUPLICATE:
    "CPF, inscrição OAB, arquivo ou vínculo já cadastrado. Consulte os registros existentes, incluindo arquivados.",
  MEMBER_VERSION_CONFLICT:
    "Este cadastro mudou em outra operação. Recarregue os dados antes de tentar novamente.",
  MEMBER_RELATIONSHIP_CYCLE: "Este vínculo criaria uma dependência circular.",
  MEMBER_ARCHIVED: "Restaure o cadastro antes de alterá-lo.",
  MEMBER_FILE_UNAVAILABLE: "O arquivo ainda não foi liberado para uso.",
  MEMBER_DOCUMENT_REPLACED: "Este documento já foi substituído. Analise a evidência atual.",
  AUTHENTICATION_REQUIRED: "Sua sessão terminou. Entre novamente.",
  PERMISSION_DENIED: "Sua conta não possui acesso a esta operação de arquivos.",
  VALIDATION_FAILED: "Confira os campos, CPF, datas, fonte e justificativa.",
  IDEMPOTENCY_CONFLICT: "Esta tentativa difere da anterior. Recarregue o cadastro.",
};
