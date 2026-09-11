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
  activate: "Associado ativado",
  block: "Associado bloqueado",
  unblock: "Associado desbloqueado",
  created: "Cadastro criado",
  update: "Cadastro corrigido",
  photo: "Foto de perfil atualizada",
  archive: "Cadastro arquivado",
  restore: "Cadastro restaurado",
  link: "Dependente vinculado",
  unlink: "Vínculo encerrado",
  document: "Documento anexado",
  review: "Documento analisado",
  assess: "Situação avaliada",
  oab_query_started: "Consulta OAB iniciada",
  oab_queried: "Consulta OAB concluída",
  oab_query_failed: "Consulta OAB não concluída",
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
  MEMBER_INVALID_STATUS_TRANSITION:
    "Esta ação não é permitida para a situação atual. Recarregue o cadastro e confira a ação disponível.",
  OAB_NOT_CONFIGURED:
    "A conexão com a OAB-BA ainda não foi ativada neste ambiente. A consulta depende da configuração das credenciais do serviço no servidor.",
  OAB_CREDENTIALS_REJECTED:
    "A OAB-BA recusou as credenciais do serviço. É necessário revisar a configuração da integração.",
  OAB_UNAVAILABLE:
    "O serviço da OAB-BA está indisponível no momento. Tente novamente em instantes.",
  OAB_TIMEOUT: "A OAB-BA não respondeu dentro do prazo. Tente novamente em instantes.",
  OAB_INVALID_RESPONSE:
    "O serviço da OAB-BA retornou uma resposta que não pôde ser confirmada. Nenhuma situação foi atribuída.",
  OAB_RATE_LIMITED:
    "Foram feitas muitas consultas em sequência. Aguarde um minuto antes de tentar novamente.",
  OAB_UNSUPPORTED_REGISTRATION:
    "A consulta integrada atende somente números de advogados da OAB/BA. Confira o estado e o tipo da inscrição.",
  OAB_MEMBER_CHANGED:
    "O cadastro mudou durante a consulta. Volte ao associado e confira a inscrição antes de tentar novamente.",
  MEMBER_DUPLICATE:
    "CPF, inscrição OAB, arquivo ou vínculo já cadastrado. Consulte os registros existentes, incluindo arquivados.",
  MEMBER_VERSION_CONFLICT:
    "Este cadastro mudou em outra operação. Recarregue os dados antes de tentar novamente.",
  MEMBER_RELATIONSHIP_CYCLE: "Este vínculo criaria uma dependência circular.",
  MEMBER_ARCHIVED: "Restaure o cadastro antes de alterá-lo.",
  MEMBER_FILE_UNAVAILABLE: "O arquivo ainda não foi liberado para uso.",
  MEMBER_PHOTO_INVALID: "Escolha uma foto JPEG ou PNG de até 5 MB.",
  MEMBER_FILE_NOT_FOUND: "O arquivo não foi encontrado neste cadastro. Envie a foto novamente.",
  MEMBER_DOCUMENT_REPLACED: "Este documento já foi substituído. Analise a evidência atual.",
  AUTHENTICATION_REQUIRED: "Sua sessão terminou. Entre novamente.",
  PERMISSION_DENIED: "Sua conta não possui permissão para esta operação em Associados.",
  VALIDATION_FAILED: "Confira os campos, CPF, datas, fonte e justificativa.",
  IDEMPOTENCY_CONFLICT: "Esta tentativa difere da anterior. Recarregue o cadastro.",
};
export const administrativeStatusLabels = {
  inactive: "Não ativado",
  active: "Ativo",
  blocked: "Bloqueado",
} as const;
