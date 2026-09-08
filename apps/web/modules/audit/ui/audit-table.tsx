import type { AuditEvent } from "@caab/contracts";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableContainer } from "@/components/ui/table";

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
      {events.length ? (
        <TableContainer aria-label="Tabela de eventos; use as setas para percorrer horizontalmente">
          <Table caption="Eventos de auditoria encontrados">
            <thead>
              <tr>
                <th scope="col">Data e hora</th>
                <th scope="col">Ação</th>
                <th scope="col">Entidade</th>
                <th scope="col">Origem</th>
                <th scope="col">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <time dateTime={event.occurredAt}>{formatTimestamp(event.occurredAt)}</time>
                  </td>
                  <td>{event.action}</td>
                  <td>
                    {event.entityType}: {event.entityId}
                  </td>
                  <td>{event.origin}</td>
                  <td>
                    <details>
                      <summary>Ver evento</summary>
                      <dl className="audit-metadata">
                        <dt>Ator</dt>
                        <dd>{event.actorUserId ?? "Sistema"}</dd>
                        <dt>Justificativa</dt>
                        <dd>{event.reason ?? "Não informada"}</dd>
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
