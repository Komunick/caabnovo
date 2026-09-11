"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SearchField, FilterToggle } from "@/components/ui/search-controls";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

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
        <SearchField id="audit-action" label="Ação" name="action" defaultValue={values.action} />
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
        <FormField id="audit-actor" label="ID do ator">
          <Input name="actorId" defaultValue={values.actorId} />
        </FormField>
        <FormField id="audit-entity-type" label="Tipo de entidade">
          <Input name="entityType" defaultValue={values.entityType} />
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
