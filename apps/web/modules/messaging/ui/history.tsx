"use client";
import { useState } from "react";
import type { MessageExecution, MessageList } from "@caab/contracts";
import { useMessageData } from "./client";
import { MessageDataState, MessagePagination, messageDate, executionReasons } from "./shared";
import { AudienceSummary } from "./audience-summary";
import styles from "./messages.module.css";
export function MessageHistory({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const result = useMessageData<MessageList<MessageExecution>>(
    `campaigns/${id}/history?page=${page}`,
  );
  return (
    <section className="panel">
      <h2>Histórico de solicitações</h2>
      <p>
        Solicitar, enviar e entregar são etapas diferentes. Ainda não há envios ou entregas neste
        módulo.
      </p>
      {result.data ? (
        <>
          {!result.data.items.length && <p>Nenhuma solicitação registrada.</p>}
          <div className={styles.history}>
            {result.data.items.map((item) => (
              <article key={item.id}>
                <h3>
                  {item.status === "scheduled"
                    ? "Programada"
                    : item.status === "blocked"
                      ? "Bloqueada"
                      : "Cancelada"}
                </h3>
                <p>
                  {item.reason ? executionReasons[item.reason] : "Aguardando o horário programado"}
                </p>
                <p>
                  Solicitada em {messageDate(item.createdAt)} · Horário previsto:{" "}
                  {messageDate(item.scheduledAt)}
                </p>
                <p>
                  Concluída: {messageDate(item.completedAt)} · Versão {item.campaignVersion}
                </p>
                {item.counts && (
                  <p>
                    {item.counts.eligible} para preparação · {item.counts.excluded} exclusões ·{" "}
                    {item.counts.suppressed} bloqueios
                  </p>
                )}
                <details>
                  <summary>Conteúdo e público desta solicitação</summary>
                  <div className={styles.preview}>
                    <strong>{item.snapshot.subject}</strong>
                    <p>{item.snapshot.body}</p>
                  </div>
                  <AudienceSummary audience={item.snapshot.audience} />
                </details>
              </article>
            ))}
          </div>
          <MessagePagination result={result.data} onPage={setPage} />
        </>
      ) : (
        <MessageDataState {...result} />
      )}
    </section>
  );
}
