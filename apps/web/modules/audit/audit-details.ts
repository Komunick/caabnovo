import type { AuditEvent } from "@caab/contracts";
import { accessLabels } from "../users/access-labels";

export type AuditDetail = { label: string; before?: string; after?: string };
type Event = Pick<AuditEvent, "action" | "entityType" | "before" | "after">;
type Format = (value: unknown) => string | undefined;

const translated =
  (labels: Record<string, string>): Format =>
  (value) =>
    typeof value === "string" && Object.hasOwn(labels, value) ? labels[value] : undefined;
const state = translated({
  active: "Ativo",
  inactive: "Inativo",
  disabled: "Desativado",
  blocked: "Bloqueado",
  suspended: "Suspenso",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  ended: "Encerrado",
  initiated: "Envio preparado",
  uploaded: "Enviado, aguardando verificação",
  available: "Disponível",
  quarantined: "Em verificação",
  queued: "Na fila",
  running: "Em processamento",
  completed: "Concluído",
  failed: "Falhou",
  cancelled: "Cancelado",
  clean: "Sem ameaça detectada",
  regular: "Regular",
  irregular: "Irregular",
  unknown: "Não informado",
  eligible: "Apto",
  ineligible: "Não apto",
  accepted: "Aceito",
  correction_requested: "Correção solicitada",
  valid: "Válido",
  invalid: "Inválido",
  exempt: "Isento",
  paid: "Em dia",
  overdue: "Em atraso",
  verified: "Verificado",
  unverified: "Não verificado",
  unavailable: "Indisponível",
  not_found: "Registro não encontrado",
  succeeded: "Concluído",
  scan_error: "Falha na verificação do arquivo",
  revoked: "Revogado",
  scanning: "Em verificação",
  infected: "Ameaça detectada",
  expired: "Expirado",
  draft: "Rascunho",
  published: "Publicado",
  hidden: "Oculto",
  archived: "Arquivado",
  superseded: "Substituído",
});
const number: Format = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("pt-BR") : undefined;
const yesNo: Format = (value) => (typeof value === "boolean" ? (value ? "Sim" : "Não") : undefined);
const date: Format = (value) => {
  if (value === null) return "Sem prazo definido";
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T/.test(value) ||
    Number.isNaN(Date.parse(value))
  )
    return undefined;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
};
const permissionList: Format = (value) => {
  if (!Array.isArray(value)) return undefined;
  if (!value.length) return "Nenhum acesso";
  return [...new Set(value.filter((item): item is string => typeof item === "string"))]
    .map((item) => accessLabels.get(item) ?? "Acesso antigo sem descrição disponível")
    .join("; ");
};
const channel = translated({ site: "Site", app: "Aplicativo" });
const channels: Format = (value) =>
  Array.isArray(value)
    ? value.map(channel).filter(Boolean).join(", ") ||
      (value.length ? "Canal sem descrição disponível" : "Nenhum canal")
    : undefined;
const photo: Format = (value) =>
  value === null ? "Sem foto" : typeof value === "string" ? "Foto cadastrada" : undefined;

/** Only known fields and values enter the human view. Unrecognized data stays in support details. */
export function describeAuditDetails(event: Event, canReadUserNames = false): AuditDetail[] {
  const details: AuditDetail[] = [];
  const add = (label: string, before: unknown, after: unknown, format: Format) => {
    const previous = format(before);
    const next = format(after);
    if (previous === undefined && next === undefined) return;
    details.push({
      label,
      ...(previous !== undefined && previous !== next ? { before: previous } : {}),
      ...(next !== undefined ? { after: next } : {}),
    });
  };
  const field = (key: string, label: string, format: Format) =>
    add(label, event.before?.[key], event.after?.[key], format);
  if (event.entityType === "user" && canReadUserNames) {
    field("name", "Nome", (value) =>
      typeof value === "string" && value.trim() && value !== "[REDACTED]" ? value : undefined,
    );
  }
  add("Situação", event.before?.status ?? event.after?.previousStatus, event.after?.status, state);
  add(
    "Situação do associado",
    event.before?.administrativeStatus ?? event.after?.previousAdministrativeStatus,
    event.after?.administrativeStatus,
    state,
  );
  field(
    "assigned",
    "Situação do acesso",
    translatedBoolean("Concedido", event.action.endsWith("revoked") ? "Removido" : "Não concedido"),
  );
  field("permissions", "Acessos", permissionList);
  field("validUntil", "Validade", date);
  field("result", "Resultado da análise", state);
  field(
    "dimension",
    "Tipo de análise",
    translated({
      registration: "Cadastro",
      membership: "Vínculo com a instituição",
      credential: "Credencial",
      eligibility: "Aptidão para benefícios",
      financial: "Situação financeira",
      professional: "Situação profissional",
      oab: "Inscrição na OAB",
      caassh: "CAASSH",
    }),
  );
  field("identificationChanged", "Dados de identificação alterados", yesNo);
  if (event.action === "member.photo") {
    const previous = event.after?.previousPhotoFileId;
    const next = event.after?.photoFileId;
    if (typeof previous === "string" && typeof next === "string" && previous !== next)
      details.push({ label: "Foto do associado", before: "Foto anterior", after: "Nova foto" });
    else add("Foto do associado", previous, next, photo);
  }
  field("channels", "Onde aparece", channels);
  field("active", "Ativo", yesNo);
  field(
    "created",
    "Operação no cadastro",
    translatedBoolean("Novo registro", "Atualização de registro existente"),
  );
  field("archived", "Arquivado", yesNo);
  field(
    "action",
    "Ação programada",
    translated({ publish: "Publicar", unpublish: "Retirar da publicação" }),
  );
  field(
    "ownerType",
    "Área do arquivo",
    translated({
      member: "Associados",
      partner: "Convênios",
      news: "Notícias",
      audit_export: "Exportação de auditoria",
      user: "Colaboradores",
    }),
  );
  field("cancelledActionIds", "Agendamentos cancelados", (value) =>
    Array.isArray(value) ? number(value.length) : undefined,
  );
  field("revision", "Versão da notícia", number);
  field("sourceRevision", "Versão usada como origem", number);
  field("version", "Versão do cadastro", number);
  field("eventCount", "Registros incluídos na exportação", number);
  field("attemptCount", "Tentativas realizadas", number);
  field("nextAttempt", "Próxima tentativa", number);
  field("runAt", "Data agendada", date);
  field("from", "Início do período", date);
  field("to", "Fim do período", date);
  field("checkedAt", "Data da consulta", date);
  field(
    "declaredMime",
    "Formato do arquivo",
    translated({
      "image/jpeg": "Imagem JPG",
      "image/png": "Imagem PNG",
      "application/pdf": "Documento PDF",
      "application/x-ndjson": "Arquivo de auditoria",
    }),
  );
  field("sizeBytes", "Tamanho do arquivo", (value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? `${(value / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB`
      : undefined,
  );
  return details;
}

function translatedBoolean(yes: string, no: string): Format {
  return (value) => (typeof value === "boolean" ? (value ? yes : no) : undefined);
}
