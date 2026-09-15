import type { AuditEvent } from "@caab/contracts";
import {
  FileText,
  Users,
  ShieldCheck,
  Newspaper,
  Handshake,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { auditEntities, auditOrigins, presentAuditEvent } from "../audit-presentation";
import { AuditEventDetails } from "./audit-event-details";

const dayFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "full",
  timeZone: "America/Sao_Paulo",
});
const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});
const icons = {
  user: ShieldCheck,
  member: Users,
  news: Newspaper,
  partner: Handshake,
  stored_file: FileText,
};

export function AuditTimeline({
  events,
  nextHref,
}: Readonly<{ events: AuditEvent[]; nextHref?: string }>) {
  const groups = new Map<string, AuditEvent[]>();
  for (const event of events) {
    const day = dayFormat.format(new Date(event.occurredAt));
    groups.set(day, [...(groups.get(day) ?? []), event]);
  }
  return (
    <section className="audit-history" aria-labelledby="audit-results-title">
      <div className="audit-history-heading">
        <h2 id="audit-results-title">Atividades</h2>
        <span>
          {events.length} {events.length === 1 ? "registro nesta página" : "registros nesta página"}
        </span>
      </div>
      {events.length ? (
        [...groups].map(([day, items]) => (
          <section className="audit-day" key={day} aria-label={day}>
            <h3>{day}</h3>
            <ol className="audit-activity-list">
              {items.map((event) => {
                const presentation = event.presentation ?? presentAuditEvent(event);
                const Icon = Object.hasOwn(icons, event.entityType)
                  ? icons[event.entityType as keyof typeof icons]
                  : Activity;
                const area = Object.hasOwn(auditEntities, event.entityType)
                  ? auditEntities[event.entityType]
                  : "Outro registro";
                return (
                  <li key={event.id}>
                    <AuditEventDetails event={event}>
                      <button
                        className="audit-activity"
                        aria-label={`Ver atividade: ${presentation.description}`}
                      >
                        <span className="audit-activity-icon" aria-hidden="true">
                          <Icon size={19} />
                        </span>
                        <span className="audit-activity-body">
                          <span className="audit-activity-description">
                            {presentation.actorLabel &&
                            presentation.description.startsWith(presentation.actorLabel) ? (
                              <>
                                <strong>{presentation.actorLabel}</strong>
                                {presentation.description.slice(presentation.actorLabel.length)}
                              </>
                            ) : (
                              presentation.description
                            )}
                          </span>
                          <span className="audit-activity-meta">
                            {area}
                            <span aria-hidden="true"> · </span>
                            {auditOrigins[event.origin]}
                          </span>
                          {presentation.changes.length > 0 && (
                            <span className="audit-activity-change">
                              {presentation.changes[0]}
                              {presentation.changes.length > 1
                                ? ` · mais ${presentation.changes.length - 1} alteração(ões)`
                                : ""}
                            </span>
                          )}
                        </span>
                        <time dateTime={event.occurredAt}>
                          {timeFormat.format(new Date(event.occurredAt))}
                        </time>
                        <ChevronRight
                          size={17}
                          className="audit-activity-arrow"
                          aria-hidden="true"
                        />
                      </button>
                    </AuditEventDetails>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      ) : (
        <div className="audit-empty">
          <Activity aria-hidden="true" size={28} />
          <h3>Nenhuma atividade encontrada</h3>
          <p>
            Nenhum evento encontrado para os filtros informados. Tente ampliar o período ou remover
            um filtro.
          </p>
        </div>
      )}
      <Pagination nextHref={nextHref} />
    </section>
  );
}
