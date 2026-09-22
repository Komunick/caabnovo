"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { userListQuerySchema, type UserListQuery } from "@caab/contracts";
import { useDraftState } from "@/components/workspace-drafts";
import { DraftForm, DraftSelect, DraftInput } from "@/components/ui/draft-controls";
import { SearchField, FilterToggle } from "@/components/ui/search-controls";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
export function UserFilters({
  query,
  roles = [],
}: {
  query: UserListQuery;
  roles?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const [filters, setFilters] = useDraftState("user-filters:filters", query);
  const [expanded, setExpanded] = useDraftState("user-filters:expanded", false);
  const queryKey = JSON.stringify(query);
  const [previousQuery, setPreviousQuery] = useState(queryKey);
  if (previousQuery !== queryKey) {
    setPreviousQuery(queryKey);
    setFilters(query);
  }
  const count = [
    filters.status,
    filters.deleted !== "excluded",
    filters.roleId,
    filters.createdFrom,
    filters.createdTo,
  ].filter(Boolean).length;
  function apply(next: UserListQuery) {
    setFilters(next);
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.status) params.set("status", next.status);
    if (next.deleted !== "excluded") params.set("deleted", next.deleted);
    if (next.roleId) params.set("roleId", next.roleId);
    if (next.createdFrom) params.set("createdFrom", next.createdFrom);
    if (next.createdTo) params.set("createdTo", next.createdTo);
    startTransition(() =>
      router.push(`/users${params.size ? `?${params}` : ""}`, { scroll: false }),
    );
  }
  return (
    <DraftForm
      draftKey="users-filters"
      className="user-list-filters"
      action="/users"
      role="search"
      aria-label="Filtros de colaboradores"
      aria-busy={pending || !hydrated}
      onSubmit={(event) => {
        event.preventDefault();
        apply(filters);
      }}
    >
      <fieldset disabled={!hydrated || pending}>
        <div className="filter-toolbar">
          <SearchField
            id="user-search"
            name="q"
            label="Nome, CPF ou e-mail"
            maxLength={160}
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          />
          <FilterToggle
            expanded={expanded}
            controls="user-filter-options"
            count={count}
            onClick={() => setExpanded(!expanded)}
          />
          {(expanded || count > 0 || filters.q) && (
            <Button size="compact" onClick={() => apply(userListQuerySchema.parse({ limit: 100 }))}>
              Limpar filtros
            </Button>
          )}
        </div>
        <div id="user-filter-options" className="list-filters" hidden={!expanded}>
          <FormField id="user-status" label="Situação">
            <DraftSelect
              name="status"
              value={filters.status ?? ""}
              onChange={(event) =>
                apply({
                  ...filters,
                  status: userListQuerySchema.shape.status.parse(event.target.value || undefined),
                })
              }
            >
              <option value="">Todas as situações</option>
              <option value="active">Ativo</option>
              <option value="disabled">Desativado</option>
            </DraftSelect>
          </FormField>
          <FormField id="user-deleted" label="Exibir colaboradores">
            <DraftSelect
              name="deleted"
              value={filters.deleted}
              onChange={(event) =>
                apply({
                  ...filters,
                  deleted: userListQuerySchema.shape.deleted.parse(event.target.value),
                })
              }
            >
              <option value="excluded">Cadastros atuais</option>
              <option value="pending">Exclusão pendente</option>
              <option value="only">Excluídos</option>
              <option value="all">Todos</option>
            </DraftSelect>
          </FormField>
          {roles.length > 0 && (
            <FormField id="user-role-filter" label="Função atribuída">
              <DraftSelect
                name="roleId"
                value={filters.roleId ?? ""}
                onChange={(event) => apply({ ...filters, roleId: event.target.value || undefined })}
              >
                <option value="">Todas as funções</option>
                <option value="none">Sem função</option>
                {roles.map((role) => (
                  <option value={role.id} key={role.id}>
                    {role.name}
                  </option>
                ))}
              </DraftSelect>
            </FormField>
          )}
          <FormField id="user-created-from" label="Cadastrado de">
            <DraftInput
              name="createdFrom"
              type="date"
              value={filters.createdFrom ?? ""}
              max={filters.createdTo}
              onChange={(event) =>
                setFilters({ ...filters, createdFrom: event.target.value || undefined })
              }
            />
          </FormField>
          <FormField id="user-created-to" label="Cadastrado até">
            <DraftInput
              name="createdTo"
              type="date"
              value={filters.createdTo ?? ""}
              min={filters.createdFrom}
              onChange={(event) =>
                setFilters({ ...filters, createdTo: event.target.value || undefined })
              }
            />
          </FormField>
          <Button type="submit" size="compact">
            Aplicar filtros
          </Button>
        </div>
        <span role="status">{pending ? "Atualizando colaboradores…" : ""}</span>
      </fieldset>
    </DraftForm>
  );
}
