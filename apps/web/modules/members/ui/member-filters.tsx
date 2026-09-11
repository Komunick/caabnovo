"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SearchField, FilterToggle } from "@/components/ui/search-controls";
import { memberDimensions, memberListSchema } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { administrativeStatusLabels, resultLabels } from "./labels";

type Query = ReturnType<typeof memberListSchema.parse>;

export function MemberFilters({ query }: { query: Query }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [filters, setFilters] = useState(query);
  const [expanded, setExpanded] = useState(false);
  const queryKey = JSON.stringify(query);
  const [previousQuery, setPreviousQuery] = useState(queryKey);
  // Keep controls in sync with pagination and browser back/forward without remounting them.
  if (previousQuery !== queryKey) {
    setPreviousQuery(queryKey);
    setFilters(query);
  }

  function apply(next: Query) {
    setFilters(next);
    const params = new URLSearchParams({
      q: next.q,
      oabState: next.oabState ?? "",
      registrationStatus: next.registrationStatus ?? "",
      archived: next.archived,
      administrativeStatus: next.administrativeStatus ?? "",
    });
    startTransition(() => router.push(`/members?${params}`, { scroll: false }));
  }

  const activeCount = [
    filters.oabState,
    filters.registrationStatus,
    filters.administrativeStatus,
    filters.archived !== "active",
  ].filter(Boolean).length;
  return (
    <form
      action="/members"
      role="search"
      aria-label="Filtros de associados"
      aria-busy={pending || !hydrated}
      onSubmit={(event) => {
        event.preventDefault();
        apply(filters);
      }}
    >
      <fieldset disabled={!hydrated}>
        <div className="filter-toolbar">
          <SearchField
            id="member-search"
            label="Nome, CPF ou inscrição OAB"
            name="q"
            maxLength={160}
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          />
          <FilterToggle
            expanded={expanded}
            controls="member-filter-options"
            count={activeCount}
            onClick={() => setExpanded(!expanded)}
          />
          {(expanded || activeCount > 0 || filters.q) && (
            <Button type="button" size="compact" onClick={() => apply(memberListSchema.parse({}))}>
              Limpar filtros
            </Button>
          )}
        </div>
        <div id="member-filter-options" className="list-filters" hidden={!expanded}>
          <div className="form-field">
            <label htmlFor="member-oab-filter">Estado da OAB</label>
            <select
              id="member-oab-filter"
              name="oabState"
              value={filters.oabState ?? ""}
              onChange={(event) =>
                apply({
                  ...filters,
                  oabState: memberListSchema.shape.oabState.parse(event.target.value || undefined),
                })
              }
            >
              <option value="">Todos os estados</option>
              {memberListSchema.shape.oabState.unwrap().options.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="member-filter">Análise cadastral</label>
            <select
              id="member-filter"
              name="registrationStatus"
              value={filters.registrationStatus ?? ""}
              onChange={(event) =>
                apply({
                  ...filters,
                  registrationStatus: memberListSchema.shape.registrationStatus.parse(
                    event.target.value || undefined,
                  ),
                })
              }
            >
              <option value="">Todas as situações</option>
              {memberDimensions.registration.map((result) => (
                <option key={result} value={result}>
                  {resultLabels[result]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="member-archived">Exibir</label>
            <select
              id="member-archived"
              name="archived"
              value={filters.archived}
              onChange={(event) =>
                apply({
                  ...filters,
                  archived: memberListSchema.shape.archived.parse(event.target.value),
                })
              }
            >
              <option value="active">Não arquivados</option>
              <option value="archived">Arquivados</option>
              <option value="all">Todos</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="member-administrative-filter">Situação administrativa</label>
            <select
              id="member-administrative-filter"
              name="administrativeStatus"
              value={filters.administrativeStatus ?? ""}
              onChange={(event) =>
                apply({
                  ...filters,
                  administrativeStatus: memberListSchema.shape.administrativeStatus.parse(
                    event.target.value || undefined,
                  ),
                })
              }
            >
              <option value="">Todas</option>
              {Object.entries(administrativeStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <span role="status">{pending ? "Atualizando cadastros…" : ""}</span>
      </fieldset>
    </form>
  );
}
