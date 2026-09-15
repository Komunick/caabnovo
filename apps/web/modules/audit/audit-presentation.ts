import type { AuditEvent } from "@caab/contracts";
import { accessLabels } from "../users/access-labels";

// Shared by the filters and summaries. Values in the audit trail never change.
export const auditActions: Record<string, string> = {
  "user.created": "Criou um colaborador",
  "user.updated": "Alterou um colaborador",
  "user.disabled": "Desativou um colaborador",
  "user.role.granted": "Concedeu um perfil de acesso",
  "user.role.revoked": "Removeu um perfil de acesso",
  "role.granted": "Concedeu um perfil de acesso",
  "role.revoked": "Removeu um perfil de acesso",
  "user.access.updated": "Alterou os acessos de um colaborador",
  "user.profile.updated": "Atualizou os dados da conta",
  "user.email.changed": "Alterou o e-mail da conta",
  "user.email.change_requested": "Solicitou a alteração do e-mail",
  "user.password.changed": "Alterou a senha",
  "user.password.reset": "Redefiniu a senha",
  "user.authenticator.removed": "Removeu o autenticador da conta",
  "session.revoke": "Encerrou uma sessão de acesso",
  "audit.export.requested": "Solicitou a exportação da auditoria",
  "audit.export.completed": "Concluiu a exportação da auditoria",
  "job.redriven": "Solicitou uma nova tentativa de processamento",
  "file.upload_intent.created": "Preparou o envio de um arquivo",
  "file.upload.finalized": "Concluiu o envio de um arquivo",
  "news.draft.created": "Criou um rascunho de notícia",
  "news.draft.updated": "Alterou um rascunho de notícia",
  "news.draft.duplicated": "Duplicou um rascunho de notícia",
  "news.archived": "Arquivou uma notícia",
  "news.revision.restored": "Restaurou uma versão da notícia",
  "news.published": "Publicou uma notícia",
  "news.unpublished": "Retirou uma notícia da publicação",
  "news.action.scheduled": "Agendou uma ação sobre uma notícia",
  "news.action.retried": "Solicitou nova tentativa de uma ação sobre uma notícia",
  "news.action.cancelled": "Cancelou uma ação agendada sobre uma notícia",
  "news.action.superseded": "Substituiu uma ação agendada sobre uma notícia",
  "news.action.completed": "Concluiu uma ação agendada sobre uma notícia",
  "member.created": "Cadastrou um associado",
  "member.create": "Cadastrou um associado",
  "member.update": "Alterou o cadastro de um associado",
  "member.photo": "Alterou a foto de um associado",
  "member.activate": "Ativou um associado",
  "member.block": "Bloqueou um associado",
  "member.unblock": "Desbloqueou um associado",
  "member.archive": "Arquivou um associado",
  "member.restore": "Restaurou um associado",
  "member.link": "Vinculou um dependente",
  "member.unlink": "Desvinculou um dependente",
  "member.document": "Adicionou um documento de associado",
  "member.review": "Revisou um documento de associado",
  "member.assess": "Registrou uma avaliação de associado",
  "member.oab_query_started": "Iniciou uma consulta à OAB",
  "member.oab_queried": "Concluiu uma consulta à OAB",
  "member.oab_query_failed": "Registrou uma falha na consulta à OAB",
  "partner.created": "Cadastrou um convênio",
  "partner.create": "Cadastrou um convênio",
  "partner.update": "Alterou um convênio",
  "partner.status": "Alterou a situação de um convênio",
  "partner.archive": "Arquivou um convênio",
  "partner.restore": "Restaurou um convênio",
  "partner.unit": "Salvou uma unidade de convênio",
  "partner.contract": "Adicionou um contrato de convênio",
  "partner.contract-status": "Alterou a situação de um contrato",
  "partner.benefit": "Salvou um benefício de convênio",
  "partner.publish": "Publicou um benefício de convênio",
  "partner.hide": "Ocultou um benefício de convênio",
  "partner.category-saved": "Salvou uma categoria de convênios",
  "partner.app-settings": "Alterou as configurações do aplicativo de convênios",
  "partner.review-moderated": "Moderou uma avaliação de convênio",
};

export const auditEntities: Record<string, string> = {
  user: "Colaborador",
  role: "Perfil de acesso",
  member: "Associado",
  partner: "Convênio",
  partner_category: "Categoria de convênios",
  partner_app_settings: "Configurações do aplicativo de convênios",
  news: "Notícia",
  stored_file: "Arquivo",
  audit_export: "Exportação de auditoria",
  job_execution: "Processamento",
  oab_lookup: "Consulta à OAB",
};

export const auditOrigins = {
  web: "Painel",
  worker: "Processamento automático",
  system: "Sistema",
};

type Names = { actorName?: string; targetName?: string; roleName?: string };
type Event = Pick<
  AuditEvent,
  "action" | "entityType" | "actorUserId" | "origin" | "before" | "after"
>;
const statusLabels: Record<string, string> = { active: "Ativo", disabled: "Desativado" };

export function presentAuditEvent(event: Event, names: Names = {}) {
  const actor =
    names.actorName ||
    (event.actorUserId
      ? "Colaborador não identificado"
      : event.origin === "web"
        ? "Autor não identificado"
        : "Sistema");
  const target = names.targetName || "colaborador não identificado";
  const label = Object.hasOwn(auditActions, event.action)
    ? auditActions[event.action]!
    : "Registrou uma ação";
  let description = `${actor} ${label.charAt(0).toLocaleLowerCase("pt-BR")}${label.slice(1)}`;
  if (
    ["user.role.granted", "role.granted", "user.role.revoked", "role.revoked"].includes(
      event.action,
    )
  ) {
    const granted = event.action.endsWith("granted");
    const role = names.roleName ? `o perfil de ${names.roleName}` : "um perfil de acesso";
    description = `${actor} ${granted ? "concedeu" : "removeu"} ${role} ${granted ? "a" : "de"} ${target}`;
  } else if (event.entityType === "user") {
    const verbs: Record<string, string> = {
      "user.created": "criou o cadastro de",
      "user.updated": "alterou o cadastro de",
      "user.disabled": "desativou o cadastro de",
      "user.access.updated": "alterou os acessos de",
    };
    description = Object.hasOwn(verbs, event.action)
      ? `${actor} ${verbs[event.action]} ${target}`
      : `${description} — ${target}`;
  }
  const changes: string[] = [];
  if (event.entityType === "user" && event.before && event.after) {
    if (
      typeof event.before.name === "string" &&
      typeof event.after.name === "string" &&
      event.before.name !== event.after.name
    )
      changes.push("Nome alterado");
    const before = event.before.status;
    const after = event.after.status;
    if (
      typeof before === "string" &&
      typeof after === "string" &&
      before !== after &&
      Object.hasOwn(statusLabels, before) &&
      Object.hasOwn(statusLabels, after)
    )
      changes.push(`Situação: ${statusLabels[before]} → ${statusLabels[after]}`);
    if (Array.isArray(event.before.permissions) && Array.isArray(event.after.permissions)) {
      const previous = new Set(
        event.before.permissions.filter((item): item is string => typeof item === "string"),
      );
      const next = new Set(
        event.after.permissions.filter((item): item is string => typeof item === "string"),
      );
      const added = [...next].filter((item) => !previous.has(item));
      const removed = [...previous].filter((item) => !next.has(item));
      const labels = (items: string[]) =>
        items.map((item) => accessLabels.get(item) ?? "Acesso não identificado").join("; ");
      if (added.length) changes.push(`Acessos concedidos: ${labels(added)}`);
      if (removed.length) changes.push(`Acessos removidos: ${labels(removed)}`);
    }
  }
  return { description, changes };
}
