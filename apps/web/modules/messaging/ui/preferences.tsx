"use client";
import { useState } from "react";
import type { MessageList, MessagePerson } from "@caab/contracts";
import { useDraftState } from "@/components/workspace-drafts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SearchField } from "@/components/ui/search-controls";
import { MessageChoice } from "./choice";
import { useMessageData, useMessageMutation } from "./client";
import { MessageShell, MessagePagination, MessageDataState } from "./shared";
import styles from "./messages.module.css";
export function MessagePreferences() {
  const [selected, setSelected] = useDraftState<MessagePerson | null>("preference:person", null);
  const [reason, setReason] = useDraftState("preference:reason", "");
  const [q, setQ] = useState("");
  const [search, setSearch] = useDraftState("preference:search", "");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const result = useMessageData<MessageList<MessagePerson>>(
    `preferences?q=${encodeURIComponent(q)}&page=${page}`,
  );
  const mutation = useMessageMutation();
  async function save() {
    if (!selected) return;
    const saved = await mutation.mutate<{ version: number }>(`preferences/${selected.id}`, "PUT", {
      blocked: !selected.blocked,
      reason,
      expectedVersion: selected.version,
    });
    if (saved) {
      setNotice(
        selected.blocked
          ? "Bloqueio removido. Isso não concede consentimento para canais futuros."
          : "Bloqueio geral registrado.",
      );
      setSelected(null);
      setReason("");
      result.reload();
    }
  }
  return (
    <MessageShell
      active="preferences"
      title="Preferências"
      description="Respeite os pedidos de não receber comunicações."
    >
      <section className="panel">
        <h2>Registrar preferência</h2>
        <p>
          O bloqueio geral exclui o associado de todas as campanhas. Sua remoção não substitui a
          definição de consentimento de cada meio.
        </p>
        <form
          className={styles.stack}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <MessageChoice
            label="Selecionar associado"
            resource="recipients"
            disabled={mutation.pending}
            onChoose={(item) => {
              setSelected({
                id: item.id,
                name: item.name!,
                blocked: item.blocked ?? false,
                version: item.version ?? 0,
                reason: item.reason ?? "",
              });
              setReason("");
              setNotice("");
            }}
          />
          {selected && (
            <>
              <p>
                <strong>{selected.name}</strong> ·{" "}
                {selected.blocked ? "Bloqueado" : "Sem bloqueio geral"}
              </p>
              {selected.reason && <p>Último motivo: {selected.reason}</p>}
              <FormField id="preference-reason" label="Motivo do registro">
                <textarea
                  value={reason}
                  required
                  minLength={3}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setReason(e.target.value)}
                />
              </FormField>
              <div className={styles.actions}>
                <Button intent="primary" type="submit" disabled={mutation.pending}>
                  {selected.blocked ? "Remover bloqueio geral" : "Bloquear comunicações"}
                </Button>
                <Button
                  disabled={mutation.pending}
                  onClick={() => {
                    setSelected(null);
                    setReason("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
          {mutation.error && <p role="alert">{mutation.error}</p>}
          {notice && <p role="status">{notice}</p>}
        </form>
      </section>
      <section className="panel">
        <h2>Associados com bloqueio</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search);
            setPage(1);
          }}
        >
          <SearchField
            id="preference-search"
            label="Buscar associado bloqueado"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        {result.data ? (
          <>
            {!result.data.items.length && <p>Nenhum bloqueio encontrado.</p>}
            <ul className={styles.people}>
              {result.data.items.map((person) => (
                <li key={person.id}>
                  <span>
                    <strong>{person.name}</strong>
                    <br />
                    {person.reason}
                  </span>
                  <Button
                    onClick={() => {
                      setSelected(person);
                      setReason("");
                    }}
                  >
                    Revisar preferência
                  </Button>
                </li>
              ))}
            </ul>
            <MessagePagination result={result.data} onPage={setPage} />
          </>
        ) : (
          <MessageDataState {...result} />
        )}
      </section>
    </MessageShell>
  );
}
