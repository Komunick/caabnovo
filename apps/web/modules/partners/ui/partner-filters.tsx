"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SearchField, FilterToggle } from "@/components/ui/search-controls";
import { Button } from "@/components/ui/button";
type Query = { q: string; category: string; status: string; channel?: string };
export function PartnerFilters({
  query,
  categories,
  benefits = false,
}: {
  query: Query;
  categories: string[];
  benefits?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filters, setFilters] = useState(query);
  const [expanded, setExpanded] = useState(false);
  const queryKey = JSON.stringify(query);
  const [previous, setPrevious] = useState(queryKey);
  if (previous !== queryKey) {
    setPrevious(queryKey);
    setFilters(query);
  }
  const path = benefits ? "/partners/benefits" : "/partners";
  function apply(next: Query) {
    setFilters(next);
    const params = new URLSearchParams({
      q: next.q,
      category: next.category,
      status: next.status,
      ...(benefits ? { channel: next.channel ?? "all" } : {}),
    });
    startTransition(() => router.push(`${path}?${params}`, { scroll: false }));
  }
  const count = [
    filters.category,
    filters.status !== "all",
    benefits && filters.channel !== "all",
  ].filter(Boolean).length;
  const statuses = benefits
    ? [
        ["all", "Todos"],
        ["draft", "Rascunhos"],
        ["visible", "Em exibição"],
        ["unavailable", "Publicados sem exibição"],
      ]
    : [
        ["all", "Não arquivados"],
        ["active", "Ativos"],
        ["suspended", "Suspensos"],
        ["archived", "Arquivados"],
      ];
  return (
    <form
      action={path}
      role="search"
      aria-label={benefits ? "Filtros de benefícios" : "Filtros de parceiros"}
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        apply(filters);
      }}
    >
      <fieldset>
        <div className="filter-toolbar">
          <SearchField
            id="partner-search"
            label={benefits ? "Benefício ou parceiro" : "Nome ou CNPJ"}
            name="q"
            maxLength={160}
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          />
          <FilterToggle
            expanded={expanded}
            controls="partner-filter-options"
            count={count}
            onClick={() => setExpanded(!expanded)}
          />
          {(expanded || count > 0 || filters.q) && (
            <Button
              type="button"
              size="compact"
              onClick={() => apply({ q: "", category: "", status: "all", channel: "all" })}
            >
              Limpar filtros
            </Button>
          )}
        </div>
        <div id="partner-filter-options" className="list-filters" hidden={!expanded}>
          <div className="form-field">
            <label htmlFor="partner-category-filter">Categoria</label>
            <select
              id="partner-category-filter"
              value={filters.category}
              onChange={(event) => apply({ ...filters, category: event.target.value })}
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="partner-status-filter">Situação</label>
            <select
              id="partner-status-filter"
              value={filters.status}
              onChange={(event) => apply({ ...filters, status: event.target.value })}
            >
              {statuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {benefits && (
            <div className="form-field">
              <label htmlFor="partner-channel-filter">Canal</label>
              <select
                id="partner-channel-filter"
                value={filters.channel}
                onChange={(event) => apply({ ...filters, channel: event.target.value })}
              >
                <option value="all">Todos os canais</option>
                <option value="site">Site</option>
                <option value="app">Aplicativo</option>
              </select>
            </div>
          )}
        </div>
        <span role="status">{pending ? "Atualizando resultados…" : ""}</span>
      </fieldset>
    </form>
  );
}
