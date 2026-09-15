"use client";

import type { AuditEvent } from "@caab/contracts";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { auditOrigins, presentAuditEvent } from "../audit-presentation";
import type { ReactNode } from "react";

export function AuditEventDetails({
  event,
  children,
}: Readonly<{ event: AuditEvent; children: ReactNode }>) {
  const presentation = event.presentation ?? presentAuditEvent(event);
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(event.occurredAt));
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="audit-detail-panel"
        title="Detalhes da atividade"
        description={presentation.description}
        focusTitle
      >
        <dl className="audit-readable-metadata">
          <div>
            <dt>Quando</dt>
            <dd>{date}</dd>
          </div>
          <div>
            <dt>Quem realizou</dt>
            <dd>{presentation.actorLabel ?? "Nome não disponível"}</dd>
          </div>
          <div>
            <dt>Pessoa ou registro afetado</dt>
            <dd>{presentation.targetLabel ?? "Identificação não disponível"}</dd>
          </div>
          <div>
            <dt>Onde aconteceu</dt>
            <dd>{auditOrigins[event.origin]}</dd>
          </div>
        </dl>
        <section className="audit-readable-details" aria-label="Informações da atividade">
          <h3>O que foi registrado</h3>
          {presentation.details?.length ? (
            <dl className="audit-change-list">
              {presentation.details.map((detail, index) => (
                <div key={`${detail.label}-${index}`}>
                  <dt>{detail.label}</dt>
                  <dd>
                    {detail.before !== undefined && (
                      <div className="audit-before">
                        <span>Antes</span>
                        <p>{detail.before}</p>
                      </div>
                    )}
                    {detail.after !== undefined && (
                      <div className="audit-after">
                        <span>{detail.before !== undefined ? "Depois" : "Registrado"}</span>
                        <p>{detail.after}</p>
                      </div>
                    )}
                    {detail.before !== undefined && detail.after === undefined && (
                      <p>O valor posterior não consta neste registro.</p>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="muted">
              Este registro não contém outros detalhes que possam ser apresentados em linguagem
              simples.
            </p>
          )}
          {event.reason && (
            <div className="audit-recorded-note">
              <h3>Observação registrada</h3>
              <p>{event.reason}</p>
            </div>
          )}
        </section>
        <p className="audit-name-note">
          Os nomes de identificação são os atuais e respeitam suas permissões. Os valores da
          alteração são os que foram registrados na época.
        </p>
        <details className="audit-support-details">
          <summary>Informações para suporte</summary>
          <p className="muted">Dados originais para uma investigação técnica, se necessário.</p>
          <dl className="audit-metadata">
            <dt>Código da ação</dt>
            <dd>{event.action}</dd>
            <dt>Tipo do registro</dt>
            <dd>{event.entityType}</dd>
            <dt>Identificador do registro</dt>
            <dd>{event.entityId}</dd>
            <dt>Identificador do evento</dt>
            <dd>{event.id}</dd>
            <dt>Identificador do autor</dt>
            <dd>{event.actorUserId ?? "Não registrado"}</dd>
            <dt>Origem original</dt>
            <dd>{event.origin}</dd>
            <dt>Requisição</dt>
            <dd>{event.requestId}</dd>
            <dt>Correlação</dt>
            <dd>{event.correlationId}</dd>
          </dl>
          {event.before && (
            <>
              <h3>Dados originais anteriores</h3>
              <pre className="audit-snapshot">{JSON.stringify(event.before, null, 2)}</pre>
            </>
          )}
          {event.after && (
            <>
              <h3>Dados originais posteriores</h3>
              <pre className="audit-snapshot">{JSON.stringify(event.after, null, 2)}</pre>
            </>
          )}
        </details>
      </DialogContent>
    </Dialog>
  );
}
