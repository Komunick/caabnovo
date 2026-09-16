"use client";
import Link from "next/link";
import { useState } from "react";
import type { MessageKind, MessageList, MessageRecord } from "@caab/contracts";
import { useDraftState } from "@/components/workspace-drafts";
import { SearchField } from "@/components/ui/search-controls";
import { FormField } from "@/components/ui/form-field";
import { Table, TableContainer } from "@/components/ui/table";
import { useMessageData } from "./client";
import { MessageShell, MessageDataState, MessagePagination, labels, messageDate } from "./shared";
import styles from "./messages.module.css";
export function MessageListPage({ kind }: { kind: MessageKind }) {
  const [search, setSearch] = useDraftState(`${kind}:search`, "");
  const [q, setQ] = useState(search);
  const [page, setPage] = useState(1);
  const [archived, setArchived] = useDraftState(`${kind}:archived`, "active");
  const result = useMessageData<MessageList<MessageRecord>>(
    `${kind}?q=${encodeURIComponent(q)}&archived=${archived}&page=${page}`,
  );
  return (
    <MessageShell
      active={kind}
      title={labels[kind].title}
      description={
        kind === "campaigns"
          ? "Prepare comunicações e acompanhe suas solicitações."
          : kind === "templates"
            ? "Guarde textos que a equipe pode reutilizar nas campanhas."
            : "Organize destinatários com filtros e exclusões."
      }
      add
    >
      <section className="panel">
        <h2>Encontrar {labels[kind].singular}</h2>
        <form
          className={styles.grid}
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search);
            setPage(1);
          }}
        >
          <SearchField
            id="message-search"
            label="Buscar por nome"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FormField id="message-archived" label="Situação">
            <select
              value={archived}
              onChange={(e) => {
                setArchived(e.target.value);
                setPage(1);
              }}
            >
              <option value="active">Ativos</option>
              <option value="archived">Arquivados</option>
              <option value="all">Todos</option>
            </select>
          </FormField>
        </form>
        {result.data ? (
          <>
            {!result.data.items.length ? (
              <p>Nenhum registro encontrado. Ajuste os filtros ou use “{labels[kind].add}”.</p>
            ) : (
              <TableContainer aria-label={labels[kind].title}>
                <Table caption={`${labels[kind].title} por situação e atualização`}>
                  <thead>
                    <tr>
                      <th scope="col">Nome</th>
                      <th scope="col">Situação</th>
                      <th scope="col">Atualizado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.items.map((item) => (
                      <tr key={item.id} className="linked-table-row">
                        <td>
                          <Link
                            className="linked-table-row__link"
                            href={`/messages/${kind}/${item.id}`}
                          >
                            {item.data.name}
                          </Link>
                        </td>
                        <td>
                          {item.archivedAt
                            ? "Arquivado"
                            : item.scheduledAt
                              ? `Programada para ${messageDate(item.scheduledAt)}`
                              : kind === "campaigns"
                                ? "Rascunho"
                                : "Disponível"}
                        </td>
                        <td>{messageDate(item.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            )}
            <MessagePagination result={result.data} onPage={setPage} />
          </>
        ) : (
          <MessageDataState {...result} />
        )}
      </section>
    </MessageShell>
  );
}
