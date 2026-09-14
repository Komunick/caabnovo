"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { PartnerCategory } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SearchField } from "@/components/ui/search-controls";
import { Table, TableContainer } from "@/components/ui/table";
import { usePartnerMutation } from "./use-partner-mutation";
import { partnerRequest } from "./client";
import styles from "./partners.module.css";
export function CategoryManager({
  initial,
  canWrite,
}: {
  initial: PartnerCategory[];
  canWrite: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<PartnerCategory | "new" | null>(null);
  const [q, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const mutation = usePartnerMutation();
  const filtered = items.filter((item) =>
    item.name.toLocaleLowerCase("pt-BR").includes(q.toLocaleLowerCase("pt-BR")),
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 25)));
  async function reload() {
    try {
      const result = await partnerRequest<{ items: PartnerCategory[] }>(
        "/api/v1/partners/categories",
      );
      setItems(result.items);
      if (editing && editing !== "new")
        setEditing(result.items.find((item) => item.id === editing.id) ?? null);
      mutation.setError("");
    } catch (error) {
      mutation.setError(error instanceof Error ? error.message : "Falha ao atualizar categorias.");
    }
  }
  return (
    <section className="panel">
      <h2>Categorias cadastradas</h2>
      <p>
        As categorias organizam os parceiros. A seleção exibida no aplicativo fica em Configurações.
      </p>
      {mutation.error && (
        <div className={styles.notice}>
          <p role="alert">{mutation.error}</p>
          <Button disabled={mutation.busy} onClick={() => void reload()}>
            Atualizar categorias
          </Button>
        </div>
      )}
      <p role="status">{mutation.notice}</p>
      <div className="filter-toolbar">
        <SearchField
          id="category-search"
          label="Buscar categoria"
          value={q}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        {canWrite && !editing && (
          <Button intent="primary" size="add" onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" />
            Nova categoria
          </Button>
        )}
      </div>
      {editing && (
        <form
          key={editing === "new" ? "new" : editing.id}
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const result = await mutation.save<{ items: PartnerCategory[] }>(
              "/api/v1/partners/categories",
              {
                ...(editing === "new" ? {} : { id: editing.id, expectedVersion: editing.version }),
                name: String(data.get("name")),
                active: data.get("active") === "on",
              },
              "Categoria salva.",
            );
            if (result) {
              setItems(result.items);
              setEditing(null);
            }
          }}
        >
          <fieldset disabled={mutation.busy}>
            <legend>{editing === "new" ? "Nova categoria" : "Editar categoria"}</legend>
            <FormField id="category-name" label="Nome da categoria">
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                defaultValue={editing === "new" ? "" : editing.name}
              />
            </FormField>
            <div className={styles.checks}>
              <label>
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={editing === "new" || editing.active}
                />
                Categoria ativa
              </label>
            </div>
            <p>Uma categoria inativa mantém os parceiros vinculados e deixa de aparecer no app.</p>

            <div className={styles.actions}>
              <Button intent="primary" type="submit">
                Salvar categoria
              </Button>
              <Button type="button" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </fieldset>
        </form>
      )}
      {!filtered.length ? (
        <p>Nenhuma categoria encontrada.</p>
      ) : (
        <TableContainer aria-label="Lista de categorias">
          <Table className={styles.table} caption="Categorias dos parceiros">
            <thead>
              <tr>
                <th scope="col">Categoria</th>
                <th scope="col">Situação</th>
                <th scope="col">Parceiros</th>
                {canWrite && <th scope="col">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.slice((currentPage - 1) * 25, currentPage * 25).map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/partners?category=${encodeURIComponent(item.name)}`}>
                      {item.name}
                    </Link>
                  </td>
                  <td>{item.active ? "Ativa" : "Inativa"}</td>
                  <td>{item.partnerCount}</td>
                  {canWrite && (
                    <td>
                      <Button
                        size="compact"
                        disabled={!!editing || mutation.busy}
                        onClick={() => setEditing(item)}
                        aria-label={`Editar categoria ${item.name}`}
                      >
                        Editar
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}
      <nav className={styles.actions} aria-label="Paginação de categorias">
        {currentPage > 1 && (
          <Button onClick={() => setPage(currentPage - 1)}>Página anterior</Button>
        )}
        <span>Página {currentPage}</span>
        {filtered.length > currentPage * 25 && (
          <Button onClick={() => setPage(currentPage + 1)}>Próxima página</Button>
        )}
      </nav>
    </section>
  );
}
