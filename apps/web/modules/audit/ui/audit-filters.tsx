"use client";
import { useDraftState } from "@/components/workspace-drafts";
import { DraftSelect, DraftForm } from "@/components/ui/draft-controls";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { auditActions, auditEntities } from "../audit-presentation";
import { AuditPersonFilter } from "./audit-person-filter";
import { AuditChoiceFilter } from "./audit-choice-filter";

type FilterValues = {
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  period?: string;
};
function localDateTime(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function actionArea(code: string) {
  if (code === "partner.category-saved") return "partner_category";
  if (code === "partner.app-settings") return "partner_app_settings";
  if (code.startsWith("role.")) return "user";
  if (code.startsWith("file.")) return "stored_file";
  if (code.startsWith("audit.")) return "audit_export";
  if (code.startsWith("job.")) return "job_execution";
  return code.split(".")[0]!;
}

export function AuditFilters({
  values,
  canReadPeople,
  selectedActorName,
}: Readonly<{ values: FilterValues; canReadPeople: boolean; selectedActorName?: string }>) {
  const router = useRouter();
  const [actorId, setActorId] = useDraftState("audit-filters:actorId", values.actorId ?? "");
  const [area, setArea] = useDraftState("audit-filters:area", values.entityType ?? "");
  const [action, setAction] = useDraftState("audit-filters:action", values.action ?? "");
  const [period, setPeriod] = useDraftState(
    "audit-filters:period",
    values.period && ["all", "day", "week", "month", "custom"].includes(values.period)
      ? values.period
      : values.from || values.to
        ? "custom"
        : "all",
  );
  const [error, setError] = useState("");
  const hasFilters = Boolean(
    values.actorId || values.action || values.entityType || values.from || values.to,
  );
  const actionOptions = [{ value: "", label: "Todas as ações" }];
  if (values.action && !Object.hasOwn(auditActions, values.action))
    actionOptions.push({ value: values.action, label: "Atividade do registro antigo" });
  for (const [code, label] of Object.entries(auditActions)) {
    const group = actionArea(code);
    if (
      area &&
      group !== area &&
      !(area === "oab_lookup" && code.startsWith("member.oab_")) &&
      code !== action
    )
      continue;
    actionOptions.push({
      value: code,
      label:
        label +
        (code.startsWith("role.") || code === "member.create" || code === "partner.create"
          ? " (registro antigo)"
          : ""),
    });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    if (String(form.get("personSearch") ?? "").trim() && !actorId) {
      setError("Selecione uma pessoa na lista ou limpe a busca pelo nome.");
      return;
    }
    const query = new URLSearchParams();
    if (actorId) query.set("actorId", actorId);
    if (action) query.set("action", action);
    if (area) query.set("entityType", area);
    if (period === "custom") {
      const from = String(form.get("from") ?? "");
      const to = String(form.get("to") ?? "");
      if (from && to && Date.parse(from) > Date.parse(to)) {
        setError("O fim do período deve ser posterior ao início.");
        return;
      }
      if (from) query.set("from", new Date(from).toISOString());
      if (to) query.set("to", new Date(to).toISOString());
    } else if (period !== "all") {
      const days = { day: 1, week: 7, month: 30 }[period];
      if (days) {
        const now = Date.now();
        query.set("from", new Date(now - days * 86400000).toISOString());
        query.set("to", new Date(now).toISOString());
      }
    }
    if (period !== "all") query.set("period", period);
    router.push(`/audit${query.size ? `?${query}` : ""}`);
  }
  return (
    <DraftForm
      draftKey="audit-audit-filters-1"
      role="search"
      aria-label="Filtros de auditoria"
      onSubmit={submit}
    >
      <div className="audit-filter-grid">
        {canReadPeople && (
          <AuditPersonFilter value={actorId} name={selectedActorName} onChange={setActorId} />
        )}
        <AuditChoiceFilter
          id="audit-entity-type"
          label="Área"
          value={area}
          placeholder="Todas as áreas"
          options={[
            { value: "", label: "Todas as áreas" },
            ...(values.entityType && !Object.hasOwn(auditEntities, values.entityType)
              ? [{ value: values.entityType, label: "Área do registro antigo" }]
              : []),
            ...Object.entries(auditEntities).map(([value, label]) => ({ value, label })),
          ]}
          onChange={(value) => {
            setArea(value);
            setAction("");
          }}
        />
        <AuditChoiceFilter
          key={area}
          id="audit-action"
          label="Ação"
          value={action}
          placeholder="Todas as ações"
          options={actionOptions}
          onChange={setAction}
        />
        <FormField id="audit-period" label="Período">
          <DraftSelect value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="all">Todo o histórico</option>
            <option value="day">Últimas 24 horas</option>
            <option value="week">Últimos 7 dias</option>
            <option value="month">Últimos 30 dias</option>
            <option value="custom">Escolher datas</option>
          </DraftSelect>
        </FormField>
      </div>
      {period === "custom" && (
        <div className="audit-date-range">
          <FormField id="audit-from" label="A partir de">
            <Input name="from" type="datetime-local" defaultValue={localDateTime(values.from)} />
          </FormField>
          <FormField id="audit-to" label="Até">
            <Input name="to" type="datetime-local" defaultValue={localDateTime(values.to)} />
          </FormField>
        </div>
      )}
      <div className="audit-filter-actions">
        <Button type="submit" intent="primary" size="compact">
          Aplicar filtros
        </Button>
        {hasFilters && (
          <Button type="button" size="compact" onClick={() => router.push("/audit")}>
            Limpar filtros
          </Button>
        )}
        {values.actorId && !canReadPeople && (
          <span className="muted">Filtro de pessoa aplicado pelo link.</span>
        )}
        {error && <p role="alert">{error}</p>}
      </div>
    </DraftForm>
  );
}
