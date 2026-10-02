import "server-only";
import { z } from "zod";
import {
  schedulingStatusLabels,
  schedulingAbsenceStatusLabels,
  validateExportSelection,
  type ExportColumn,
  type ExportFilter,
} from "@caab/contracts";
import { schedulingBlockedMembersCte } from "@caab/db/repositories/members";
import { ExportError, type ExportAdapter } from "../exports/catalog";
import { absenceStatusSql } from "./absence-service";

const bookings = `${schedulingBlockedMembersCte}
 SELECT b.id::text AS "id", b.starts_at AS "startsAt", b.ends_at AS "endsAt",
 m.name AS "memberName", b.member_id AS "memberId", f.name AS "professionalName",
 f.id AS "professionalId", u.name AS "unitName", u.id AS "unitId",
 s.name AS "serviceName", p.name AS "procedureName", b.duration_snapshot AS "durationMinutes",
 b.status AS "status",
 CASE WHEN b.status IN ('scheduled','pending_approval','awaiting_new_time') AND (b.starts_at IS NULL OR b.starts_at>clock_timestamp())
   AND EXISTS(SELECT 1 FROM scheduling_blocked_members blocked WHERE blocked.id=b.member_id)
   THEN 'Bloqueado' END AS "eligibilityWarning",
 coalesce(m.deletion_effective_at<=clock_timestamp(),false) AS "memberDeleted",
 coalesce(m.deletion_effective_at<=clock_timestamp() AND b.member_deletion_reviewed_at=m.deletion_effective_at,false) AS "keptAfterMemberDeletion"
 FROM scheduling_booking b JOIN member m ON m.id=b.member_id
 JOIN scheduling_procedure p ON p.id=b.procedure_id JOIN scheduling_service s ON s.id=p.service_id
 JOIN scheduling_unit u ON u.id=p.unit_id LEFT JOIN scheduling_professional f ON f.id=b.professional_id`;

const absenceDateKeys = [
  "startsAt",
  "endsAt",
  "recordedAt",
  "appealDeadline",
  "restrictionEndsAt",
  "submittedAt",
  "decidedAt",
];
const absences = `SELECT a.id::text AS "id",a.booking_id AS "bookingId",a.member_id AS "memberId",
 m.name AS "memberName",u.id AS "unitId",u.name AS "unitName",s.name AS "serviceName",p0.name AS "procedureName",
 b.starts_at AS "startsAt",b.ends_at AS "endsAt",a.recorded_at AS "recordedAt",a.appeal_deadline AS "appealDeadline",
 a.restriction_ends_at AS "restrictionEndsAt",${absenceStatusSql("statement_timestamp()")} AS "status",
 (a.recorded_at<=statement_timestamp() AND a.restriction_ends_at>statement_timestamp() AND p.outcome IS DISTINCT FROM 'accepted') AS "restrictionActive",
 p.kind AS "appealKind",p.submitted_at AS "submittedAt",p.outcome AS "outcome",p.decided_at AS "decidedAt",
 recorder.name AS "recordedByName",reviewer.name AS "decidedByName"
 FROM scheduling_absence a JOIN scheduling_booking b ON b.id=a.booking_id JOIN member m ON m.id=a.member_id
 JOIN scheduling_procedure p0 ON p0.id=b.procedure_id JOIN scheduling_service s ON s.id=p0.service_id
 JOIN scheduling_unit u ON u.id=p0.unit_id JOIN "user" recorder ON recorder.id=a.recorded_by
 LEFT JOIN scheduling_absence_appeal p ON p.absence_id=a.id LEFT JOIN "user" reviewer ON reviewer.id=p.decided_by`;
// One row per existing catalog item. Non-applicable fields remain NULL.
const catalog = `
 SELECT u.id::text AS "id", 'units'::text AS "kind", u.name AS "name", u.active AS "active",
 u.id AS "unitId", NULL::uuid AS "serviceId", NULL::uuid AS "procedureId", NULL::uuid AS "professionalId",
 u.name AS "unitName", NULL::text AS "serviceName", NULL::text AS "procedureName", NULL::text AS "professionalName",
 NULL::integer AS "durationMinutes", NULL::text AS "description", u.phone AS "phone",
 concat_ws(', ',NULLIF(u.address->>'street',''),NULLIF(u.address->>'number',''),NULLIF(u.address->>'complement',''),
 NULLIF(u.address->>'neighborhood',''),NULLIF(u.address->>'city',''),NULLIF(u.address->>'state',''),NULLIF(u.address->>'postalCode','')) AS "address"
 FROM scheduling_unit u
 UNION ALL
 SELECT s.id::text,'services',s.name,s.active,u.id,s.id,NULL,NULL,u.name,s.name,NULL,NULL,NULL,NULL,NULL,NULL
 FROM scheduling_service s JOIN scheduling_unit u ON u.id=s.unit_id
 UNION ALL
 SELECT p.id::text,'procedures',p.name,p.active,u.id,s.id,p.id,NULL,u.name,s.name,p.name,NULL,p.duration_minutes,p.description,NULL,NULL
 FROM scheduling_procedure p JOIN scheduling_service s ON s.id=p.service_id JOIN scheduling_unit u ON u.id=p.unit_id
 UNION ALL
 SELECT f.id::text,'professionals',f.name,f.active,NULL,NULL,NULL,f.id,NULL,NULL,NULL,f.name,NULL,NULL,NULL,NULL
 FROM scheduling_professional f
 UNION ALL
 SELECT a.id::text,'assignments',f.name || ' — ' || p.name,a.active,u.id,s.id,p.id,f.id,u.name,s.name,p.name,f.name,NULL,NULL,NULL,NULL
 FROM scheduling_assignment a JOIN scheduling_professional f ON f.id=a.professional_id
 JOIN scheduling_procedure p ON p.id=a.procedure_id JOIN scheduling_service s ON s.id=p.service_id
 JOIN scheduling_unit u ON u.id=a.unit_id`;
const hours = `
 SELECT 'units/' || h.unit_id || '/' || h.weekday AS "id", 'units'::text AS "kind",
 u.id AS "unitId", NULL::uuid AS "professionalId", u.name AS "unitName", NULL::text AS "professionalName",
 h.weekday AS "weekday", to_char(h.start_local,'HH24:MI') AS "start", to_char(h.end_local,'HH24:MI') AS "end",
 NULL::text AS "lunchStart", NULL::text AS "lunchEnd",NULL::uuid AS "serviceId",NULL::text AS "serviceName"
 FROM scheduling_unit_hours h JOIN scheduling_unit u ON u.id=h.unit_id
 UNION ALL
 SELECT 'professionals/' || h.unit_id || '/' || h.professional_id || '/' || h.weekday,
 'professionals',u.id,f.id,u.name,f.name,h.weekday,to_char(h.start_local,'HH24:MI'),to_char(h.end_local,'HH24:MI'),
 to_char(h.lunch_start,'HH24:MI'),to_char(h.lunch_end,'HH24:MI'),NULL,NULL
 FROM scheduling_professional_hours h JOIN scheduling_unit u ON u.id=h.unit_id
 JOIN scheduling_professional f ON f.id=h.professional_id
 UNION ALL
 SELECT 'services/' || h.service_id || '/' || h.weekday,'services',u.id,NULL,u.name,NULL,h.weekday,
 to_char(h.start_local,'HH24:MI'),to_char(h.end_local,'HH24:MI'),NULL,NULL,s.id,s.name
 FROM scheduling_service_hours h JOIN scheduling_service s ON s.id=h.service_id JOIN scheduling_unit u ON u.id=s.unit_id`;
const labels: Record<string, string> = {
  id: "Identificador",
  recordedAt: "Registro da falta (Bahia)",
  appealDeadline: "Prazo de resposta (Bahia)",
  restrictionEndsAt: "Fim do bloqueio (Bahia)",
  restrictionActive: "Restrição ativa por esta falta",
  appealKind: "Tipo de pedido",
  submittedAt: "Pedido apresentado (Bahia)",
  outcome: "Resultado da análise",
  decidedAt: "Decisão (Bahia)",
  recordedByName: "Falta registrada por",
  decidedByName: "Analisado por",
  startsAt: "Início (Bahia)",
  endsAt: "Fim (Bahia)",
  memberName: "Beneficiário",
  professionalName: "Profissional",
  unitName: "Unidade",
  status: "Situação",
  eligibilityWarning: "Aviso de bloqueio",
  serviceName: "Serviço",
  procedureName: "Procedimento",
  durationMinutes: "Duração (minutos)",
  memberDeleted: "Associado excluído",
  keptAfterMemberDeletion: "Reserva mantida após exclusão",
  kind: "Cadastro",
  name: "Nome",
  active: "Ativo",
  description: "Descrição",
  phone: "Telefone da unidade",
  address: "Endereço da unidade",
  weekday: "Dia (0=domingo)",
  start: "Início",
  end: "Fim",
  lunchStart: "Início do almoço",
  lunchEnd: "Fim do almoço",
};
const kindLabels: Record<string, string> = {
  units: "Unidades",
  services: "Serviços",
  procedures: "Procedimentos",
  professionals: "Profissionais",
  assignments: "Habilitações",
};
const idFilters = (keys: string[]): ExportFilter[] =>
  keys.map((key) => ({
    key,
    label: (
      {
        unitId: "ID da unidade",
        professionalId: "ID do profissional",
        memberId: "ID do beneficiário",
        serviceId: "ID do serviço",
        procedureId: "ID do procedimento",
      } as Record<string, string>
    )[key]!,
    type: "text",
  }));
const kinds = (keys: string[]): ExportFilter => ({
  key: "kind",
  label: "Cadastro",
  type: "choice",
  options: keys.map((value) => ({ value, label: kindLabels[value]! })),
});
function adapter(
  dataset: string,
  label: string,
  source: string,
  keys: string[],
  defaults: string[],
  filters: ExportFilter[],
  defaultOrder: string[],
): ExportAdapter {
  const columns: ExportColumn[] = keys.map((key) => ({
    key,
    label: labels[key]!,
    defaultSelected: defaults.includes(key),
    sortable: true,
    scalarType: ["durationMinutes", "weekday"].includes(key)
      ? "number"
      : ["active", "memberDeleted", "keptAfterMemberDeletion", "restrictionActive"].includes(key)
        ? "boolean"
        : absenceDateKeys.includes(key)
          ? "date"
          : "text",
  }));
  return {
    module: "scheduling",
    dataset,
    label,
    permission: "scheduling:read",
    scope: "module",
    columns,
    filters,
    query(input) {
      try {
        validateExportSelection(input, { columns, filters });
      } catch {
        throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
      }
      const values: unknown[] = [],
        where: string[] = [];
      const param = (value: unknown) => {
        values.push(value);
        return `$${values.length}`;
      };
      for (const [key, value] of Object.entries(input.filters)) {
        if (value === "") continue;
        if (key.endsWith("Id")) {
          if (!z.uuid().safeParse(value).success)
            throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
          where.push(`d."${key}"=${param(value)}::uuid`);
        } else if (key === "q") {
          if (dataset === "absences" && !z.string().trim().max(100).safeParse(value).success)
            throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
          const search = dataset === "absences" ? String(value).trim() : String(value);
          where.push(
            `d."${dataset === "bookings" || dataset === "absences" ? "memberName" : "name"}" ILIKE ${param(`%${search.replace(/[\\%_]/g, "\\$&")}%`)} ESCAPE '\\'`,
          );
        } else if (key === "from")
          where.push(
            `d."${dataset === "absences" ? "recordedAt" : "startsAt"}">=(${param(value)}::date::timestamp AT TIME ZONE 'America/Bahia')`,
          );
        else if (key === "to")
          where.push(
            `d."${dataset === "absences" ? "recordedAt" : "startsAt"}"<((${param(value)}::date+1)::timestamp AT TIME ZONE 'America/Bahia')`,
          );
        else where.push(`d."${key}"=${param(value)}${key === "active" ? "::boolean" : ""}`);
      }
      if (input.context?.recordId) where.push(`d."id"=${param(input.context.recordId)}`);
      const selection = input.columns.map((key) => {
        const field = `d."${key}"`;
        const expression = absenceDateKeys.includes(key)
          ? `to_char(${field} AT TIME ZONE 'America/Bahia','DD/MM/YYYY HH24:MI:SS')`
          : key === "status"
            ? `CASE ${field} ${Object.entries(
                dataset === "absences" ? schedulingAbsenceStatusLabels : schedulingStatusLabels,
              )
                .map(([value, label]) => `WHEN '${value}' THEN '${label}'`)
                .join(" ")} ELSE ${field} END`
            : key === "appealKind"
              ? `CASE ${field} WHEN 'justification' THEN 'Justificativa' WHEN 'contestation' THEN 'Contestação' END`
              : key === "outcome"
                ? `CASE ${field} WHEN 'accepted' THEN 'Falta abonada' WHEN 'rejected' THEN 'Pedido rejeitado' END`
                : key === "kind"
                  ? `CASE ${field} ${Object.entries(kindLabels)
                      .map(([kind, name]) => `WHEN '${kind}' THEN '${name}'`)
                      .join(" ")} ELSE ${field} END`
                  : field;
        return `${expression} AS "${key}"`;
      });
      const order = input.sort.length
        ? input.sort.map(
            (s) => `d."${s.field}" ${s.direction === "desc" ? "DESC" : "ASC"} NULLS LAST`,
          )
        : defaultOrder.map(
            (key) => `d."${key}" ${dataset === "absences" ? "DESC" : "ASC"} NULLS LAST`,
          );
      order.push(`d."id" ${dataset === "absences" && !input.sort.length ? "DESC" : "ASC"}`);
      return {
        text: `SELECT d."id" AS "_recordId", ${selection.join(", ")} FROM (${source}) d ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order.join(", ")}`,
        values,
      };
    },
    map(row) {
      return {
        id: String(row._recordId),
        values: Object.fromEntries(
          Object.entries(row)
            .filter(([key]) => keys.includes(key))
            .map(([key, value]) => [
              key,
              value == null
                ? null
                : typeof value === "number" || typeof value === "boolean"
                  ? value
                  : String(value),
            ]),
        ),
      };
    },
  };
}
export const schedulingExports: ExportAdapter[] = [
  adapter(
    "bookings",
    "Agendamentos — Reservas",
    bookings,
    [
      "id",
      "startsAt",
      "memberName",
      "professionalName",
      "unitName",
      "status",
      "eligibilityWarning",
      "endsAt",
      "serviceName",
      "procedureName",
      "durationMinutes",
      "memberDeleted",
      "keptAfterMemberDeletion",
    ],
    [
      "id",
      "startsAt",
      "memberName",
      "professionalName",
      "unitName",
      "status",
      "eligibilityWarning",
    ],
    [
      { key: "q", label: "Beneficiário", type: "text" },
      { key: "from", label: "A partir de", type: "date" },
      { key: "to", label: "Até", type: "date" },
      ...idFilters(["memberId", "professionalId", "unitId"]),
      {
        key: "status",
        label: "Situação",
        type: "choice",
        options: [
          ...Object.entries(schedulingStatusLabels).map(([value, label]) => ({ value, label })),
        ],
      },
    ],
    ["startsAt"],
  ),
  adapter(
    "catalog",
    "Agendamentos — Cadastros",
    catalog,
    [
      "id",
      "kind",
      "name",
      "active",
      "unitName",
      "serviceName",
      "procedureName",
      "professionalName",
      "durationMinutes",
      "description",
      "phone",
      "address",
    ],
    ["id", "kind", "name", "active"],
    [
      kinds(Object.keys(kindLabels)),
      { key: "q", label: "Nome", type: "text" },
      {
        key: "active",
        label: "Estado",
        type: "choice",
        options: [
          { value: "true", label: "Ativo" },
          { value: "false", label: "Inativo" },
        ],
      },
      ...idFilters(["unitId", "serviceId", "procedureId", "professionalId"]),
    ],
    ["name"],
  ),
  adapter(
    "hours",
    "Agendamentos — Horários",
    hours,
    [
      "id",
      "kind",
      "unitName",
      "serviceName",
      "professionalName",
      "weekday",
      "start",
      "end",
      "lunchStart",
      "lunchEnd",
    ],
    ["id", "kind", "unitName", "serviceName", "professionalName", "weekday", "start", "end"],
    [
      kinds(["units", "professionals", "services"]),
      ...idFilters(["unitId", "professionalId", "serviceId"]),
    ],
    ["unitName", "professionalName", "weekday"],
  ),
  adapter(
    "absences",
    "Agendamentos — Faltas",
    absences,
    [
      "id",
      "memberName",
      "unitName",
      "serviceName",
      "procedureName",
      "startsAt",
      "endsAt",
      "recordedAt",
      "appealDeadline",
      "restrictionEndsAt",
      "status",
      "restrictionActive",
      "appealKind",
      "submittedAt",
      "outcome",
      "decidedAt",
      "recordedByName",
      "decidedByName",
    ],
    [
      "memberName",
      "unitName",
      "procedureName",
      "recordedAt",
      "status",
      "appealDeadline",
      "restrictionEndsAt",
      "restrictionActive",
    ],
    [
      { key: "q", label: "Nome do beneficiário", type: "text" },
      {
        key: "status",
        label: "Situação",
        type: "choice",
        options: Object.entries(schedulingAbsenceStatusLabels).map(([value, label]) => ({
          value,
          label,
        })),
      },
      { key: "from", label: "Registro a partir de", type: "date" },
      { key: "to", label: "Registro até", type: "date" },
      ...idFilters(["memberId", "unitId"]),
    ],
    ["recordedAt"],
  ),
];
