import type { PartnerHistoryItem } from "@caab/contracts";
export const statusLabels = {
  active: "Ativo",
  suspended: "Suspenso",
  draft: "Aguardando aprovação",
  approved: "Aprovado",
  ended: "Encerrado",
};
export function formatDate(value: string | null) {
  if (!value) return "Não informado";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split("-").reverse().join("/");
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bahia",
  }).format(new Date(value));
}
export function historyDescription(event: PartnerHistoryItem) {
  const actions: Record<string, string> = {
    "partner.created": "cadastrou o parceiro",
    "partner.update": "atualizou o cadastro",
    "partner.archive": "arquivou o parceiro",
    "partner.restore": "restaurou o parceiro",
    "partner.status":
      event.after.status === "suspended"
        ? "suspendeu o parceiro e retirou seus benefícios"
        : "reativou o parceiro",
    "partner.unit": event.after.created ? "adicionou uma unidade" : "atualizou uma unidade",
    "partner.contract": "registrou um contrato",
    "partner.contract-status":
      event.after.status === "approved" ? "aprovou um contrato" : "encerrou um contrato",
    "partner.benefit": event.after.created
      ? "criou um rascunho de benefício"
      : "atualizou o rascunho de um benefício",
    "partner.publish": "publicou um benefício",
    "partner.hide": "retirou um benefício de exibição",
  };
  return `${event.actorName || "Operador"} ${actions[event.action] || "registrou uma alteração no parceiro"}.`;
}
export const partnerErrors: Record<string, string> = {
  PARTNER_DUPLICATE:
    "Já existe um parceiro com este CNPJ. Confira os cadastros, inclusive os arquivados.",
  PARTNER_VERSION_CONFLICT:
    "Outra pessoa alterou este parceiro. Recarregue os dados e revise antes de salvar.",
  PARTNER_INVALID_REFERENCE: "A unidade ou o contrato selecionado não pertence a este parceiro.",
  PARTNER_PUBLICATION_INCOMPLETE:
    "Preencha título, descrição, condições, público, unidade, contrato, datas e canais antes de publicar.",
  PARTNER_CONTRACT_UNAVAILABLE:
    "Selecione um contrato aprovado e com vigência que cubra todo o benefício.",
  PARTNER_UNIT_UNAVAILABLE: "Selecione uma unidade ativa deste parceiro.",
  PARTNER_BENEFIT_EXPIRED: "O benefício já venceu. Atualize a vigência antes de publicar.",
  PARTNER_SUSPENDED: "Reative o parceiro antes de publicar benefícios.",
  PARTNER_ARCHIVED: "Restaure o parceiro antes de alterar seu cadastro.",
  PARTNER_FILE_UNAVAILABLE: "O documento ainda não foi liberado pela verificação de segurança.",
  PARTNER_FILE_NOT_FOUND: "Documento não encontrado neste parceiro.",
  PARTNER_NOT_FOUND: "Parceiro não encontrado ou indisponível para esta ação.",
  PARTNER_STATE_UNCHANGED: "O parceiro já está nessa situação.",
  PARTNER_CONTRACT_STATE: "O contrato já foi aprovado ou encerrado. Confira os dados atuais.",
  PARTNER_BENEFIT_NOT_PUBLISHED: "O benefício não está publicado. Confira os dados atuais.",
  AUTHENTICATION_REQUIRED: "Sua sessão terminou. Entre novamente para continuar.",
  PERMISSION_DENIED: "Sua conta não tem acesso a esta ação.",
  VALIDATION_FAILED: "Confira os campos e os formatos informados antes de salvar.",
  IDEMPOTENCY_CONFLICT:
    "Esta tentativa já foi usada com outros dados. Recarregue e revise a operação.",
};
