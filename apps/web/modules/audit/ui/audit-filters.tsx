"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FilterToggle } from "@/components/ui/search-controls";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { auditActions, auditEntities } from "../audit-presentation";

type FilterValues = {
  actorId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
};

function localDateTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AuditFilters({ values }: Readonly<{ values: FilterValues }>) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const count = [values.actorId, values.entityType, values.from, values.to].filter(Boolean).length;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    for (const key of ["actorId", "action", "entityType"] as const) {
      const value = String(form.get(key) ?? "").trim();
      if (value) query.set(key, value);
    }
    for (const key of ["from", "to"] as const) {
      const value = String(form.get(key) ?? "");
      if (value) query.set(key, new Date(value).toISOString());
    }
    router.push(`/audit${query.size ? `?${query}` : ""}`);
  }

  return (
    <form role="search" aria-label="Filtros de auditoria" onSubmit={submit}>
      <div className="filter-toolbar">
        <FormField id="audit-action" label="Ação" className="search-field">
          <select name="action" defaultValue={values.action ?? ""}>
            <option value="">Todas as ações</option>
            {values.action && !Object.hasOwn(auditActions, values.action) && (
              <option value={values.action}>Ação do link atual</option>
            )}
            {Object.entries(auditActions).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
                {code.startsWith("role.") ? " (registro antigo)" : ""}
              </option>
            ))}
          </select>
        </FormField>
        <Button type="submit" intent="primary" size="compact">
          Buscar
        </Button>
        <FilterToggle
          expanded={expanded}
          controls="audit-filter-options"
          count={count}
          onClick={() => setExpanded(!expanded)}
        />
        {(expanded || count > 0 || values.action) && (
          <Button type="reset" onClick={() => router.push("/audit")}>
            Limpar filtros
          </Button>
        )}
      </div>
      <div className="list-filters" id="audit-filter-options" hidden={!expanded}>
        <FormField id="audit-actor" label="Identificador de quem realizou a ação">
          <Input
            name="actorId"
            maxLength={36}
            pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
            defaultValue={values.actorId}
          />
        </FormField>
        <FormField id="audit-entity-type" label="Área">
          <select name="entityType" defaultValue={values.entityType ?? ""}>
            <option value="">Todas as áreas</option>
            {values.entityType && !Object.hasOwn(auditEntities, values.entityType) && (
              <option value={values.entityType}>Área do link atual</option>
            )}
            {Object.entries(auditEntities).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="audit-from" label="A partir de">
          <Input name="from" type="datetime-local" defaultValue={localDateTime(values.from)} />
        </FormField>
        <FormField id="audit-to" label="Até">
          <Input name="to" type="datetime-local" defaultValue={localDateTime(values.to)} />
        </FormField>
        <Button intent="primary" size="compact" type="submit">
          Aplicar filtros
        </Button>
      </div>
    </form>
  );
}
