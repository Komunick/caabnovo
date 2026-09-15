import type { AuditEvent } from "@caab/contracts";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableContainer } from "@/components/ui/table";
import { auditEntities, auditOrigins, presentAuditEvent } from "../audit-presentation";

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function Snapshot({ label, value }: Readonly<{ label: string; value: object | null }>) {
  if (!value) return null;
  return (
    <div>
      <h3>{label}</h3>
      <pre className="audit-snapshot">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

export function AuditTable({
  events,
  nextHref,
}: Readonly<{ events: AuditEvent[]; nextHref?: string }>) {
  return (
    <section className="panel" aria-labelledby="audit-results-title">
      <h2 id="audit-results-title">Eventos encontrados</h2>
      <p className="muted">
        Os nomes exibidos são os atuais e dependem da sua permissão de consulta. Os dados
        registrados na época estão nos detalhes técnicos.
      </p>
      {events.length ? (
        <TableContainer aria-label="Tabela de eventos; use as setas para percorrer horizontalmente">
          <Table
            className="audit-events-table"
            role="table"
            caption="Eventos de auditoria encontrados"
          >
            <thead>
              <tr>
                <th scope="col">Data e hora</th>
                <th scope="col">O que aconteceu</th>
                <th scope="col">Área</th>
                <th scope="col">Origem</th>
                <th scope="col">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td data-label="Data e hora">
                    <time dateTime={event.occurredAt}>{formatTimestamp(event.occurredAt)}</time>
                  </td>
                  <td data-label="O que aconteceu">
                    <p>{(event.presentation ?? presentAuditEvent(event)).description}</p>
                    {(event.presentation ?? presentAuditEvent(event)).changes.map((change) => (
                      <p key={change} className="muted">
                        {change}
                      </p>
                    ))}
                  </td>
                  <td data-label="Área">
                    {Object.hasOwn(auditEntities, event.entityType)
                      ? auditEntities[event.entityType]
                      : "Outro registro"}
                  </td>
                  <td data-label="Origem">{auditOrigins[event.origin]}</td>
                  <td data-label="Detalhes">
                    <details>
                      <summary>Detalhes técnicos</summary>
                      <dl className="audit-metadata">
                        <dt>Código da ação</dt>
                        <dd>{event.action}</dd>
                        <dt>Tipo do registro</dt>
                        <dd>{event.entityType}</dd>
                        <dt>Identificador do registro afetado</dt>
                        <dd>{event.entityId}</dd>
                        <dt>Identificador do evento</dt>
                        <dd>{event.id}</dd>
                        <dt>Origem registrada</dt>
                        <dd>{event.origin}</dd>
                        <dt>Identificador de quem realizou a ação</dt>
                        <dd>{event.actorUserId ?? "Não registrado"}</dd>
                        {event.reason && (
                          <>
                            <dt>Justificativa registrada</dt>
                            <dd>{event.reason}</dd>
                          </>
                        )}
                        <dt>Requisição</dt>
                        <dd>{event.requestId}</dd>
                        <dt>Correlação</dt>
                        <dd>{event.correlationId}</dd>
                      </dl>
                      <Snapshot label="Antes" value={event.before} />
                      <Snapshot label="Depois" value={event.after} />
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <p>Nenhum evento encontrado para os filtros informados.</p>
      )}
      <Pagination nextHref={nextHref} />
    </section>
  );
}
