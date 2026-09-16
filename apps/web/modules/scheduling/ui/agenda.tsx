"use client";
import { useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { DraftInput, DraftSelect, DraftForm } from "@/components/ui/draft-controls";
import Link from "next/link";
import { type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SchedulingBooking, SchedulingPage } from "@caab/contracts";
import { Table, TableContainer } from "@/components/ui/table";
import { SearchField, FilterToggle } from "@/components/ui/search-controls";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { schedulingDate } from "../availability";
import {
  Choice,
  DataState,
  Pagination,
  SchedulingShell,
  timeLabel,
  useSchedulingData,
} from "./shared";

export function SchedulingAgenda() {
  const query = useSearchParams();
  const router = useRouter();
  const date = query.get("date") || schedulingDate();
  const path = `bookings?${new URLSearchParams({ ...Object.fromEntries(query), date }).toString()}`;
  const result = useSchedulingData<SchedulingPage<SchedulingBooking>>(path);
  function changePage(page: number) {
    const next = new URLSearchParams(query);
    next.set("date", date);
    next.set("page", String(page));
    router.push(`/scheduling?${next}`);
  }
  return (
    <SchedulingShell
      title="Agenda diária"
      description="Consulte os atendimentos, crie reservas e acompanhe a agenda do dia."
    >
      <section className="panel">
        <h2>Encontrar reserva</h2>
        <AgendaFilters key={query.toString()} initial={new URLSearchParams(query)} date={date} />
        {result.data ? (
          <>
            {result.data.items.length ? (
              <TableContainer aria-label="Reservas do dia">
                <Table className="scheduling-table" caption="Reservas por horário e beneficiário">
                  <thead>
                    <tr>
                      <th scope="col">Horário</th>
                      <th scope="col">Beneficiário</th>
                      <th scope="col">Atendimento</th>
                      <th scope="col">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.items.map((booking) => (
                      <tr key={booking.id} className="linked-table-row">
                        <td className="scheduling-time">
                          {timeLabel(booking.startsAt)} às {timeLabel(booking.endsAt)}
                        </td>
                        <td>
                          <Link
                            className="linked-table-row__link"
                            aria-label={`Ver reserva de ${booking.memberName} às ${timeLabel(booking.startsAt)}`}
                            href={`/scheduling/${booking.id}`}
                          >
                            {booking.memberName}
                          </Link>
                        </td>
                        <td>
                          <strong>{booking.procedureName}</strong>
                          <span className="scheduling-muted">{booking.professionalName}</span>
                          <span className="scheduling-muted">
                            {booking.unitName} · {booking.serviceName}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge">
                            {booking.status === "scheduled" ? "Agendado" : "Cancelado"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableContainer>
            ) : (
              <div className="scheduling-empty">
                <h3>Nenhuma reserva encontrada para esses filtros.</h3>
                <p>
                  Escolha outra data ou crie uma reserva. Para começar a configurar os atendimentos,
                  acesse Unidades.
                </p>
                <div className="scheduling-actions">
                  <Link className={buttonVariants()} href="/scheduling/new">
                    Criar reserva
                  </Link>
                  <Link className={buttonVariants()} href="/scheduling/catalog?kind=units">
                    Configurar atendimentos
                  </Link>
                </div>
              </div>
            )}
            <Pagination {...result.data} onPage={changePage} />
          </>
        ) : (
          <DataState error={result.error} reload={result.reload} />
        )}
      </section>
    </SchedulingShell>
  );
}
function AgendaFilters({ initial, date }: { initial: URLSearchParams; date: string }) {
  const drafts = useDraftCache();
  const router = useRouter();
  const [unitId, setUnitId] = useDraftState("agenda:unitId", initial.get("unitId") ?? "");
  const [expanded, setExpanded] = useDraftState(
    "agenda:expanded",
    !!(initial.get("unitId") || initial.get("professionalId") || initial.get("status")),
  );
  const [professionalId, setProfessionalId] = useDraftState(
    "agenda:professionalId",
    initial.get("professionalId") ?? "",
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ["date", "q", "status"]) {
      const value = String(form.get(key) ?? "");
      if (value) next.set(key, value);
    }
    if (unitId) next.set("unitId", unitId);
    if (professionalId) next.set("professionalId", professionalId);
    router.push(`/scheduling?${next}`);
  }
  return (
    <DraftForm
      draftKey="scheduling-agenda-1"
      role="search"
      aria-label="Filtros de reservas"
      className="scheduling-filters"
      onSubmit={submit}
    >
      <div className="filter-toolbar">
        <FormField id="agenda-date" label="Data">
          <DraftInput name="date" type="date" required defaultValue={date} />
        </FormField>
        <SearchField
          id="agenda-person"
          label="Nome do beneficiário"
          name="q"
          maxLength={160}
          defaultValue={initial.get("q") ?? ""}
        />
        <FilterToggle
          expanded={expanded}
          controls="agenda-extra-filters"
          count={[unitId, professionalId, initial.get("status")].filter(Boolean).length}
          onClick={() => setExpanded(!expanded)}
        />
        <Button type="submit">Aplicar filtros</Button>
        <Link
          className={buttonVariants({ size: "compact" })}
          href="/scheduling"
          onClick={() => {
            drafts.clear("scheduling-agenda-1:");
            setUnitId("");
            setProfessionalId("");
          }}
        >
          Limpar filtros
        </Link>
      </div>
      <div id="agenda-extra-filters" hidden={!expanded}>
        <div className="scheduling-grid">
          <FormField id="agenda-status" label="Estado">
            <DraftSelect name="status" defaultValue={initial.get("status") ?? ""}>
              <option value="">Todos</option>
              <option value="scheduled">Agendado</option>
              <option value="cancelled">Cancelado</option>
            </DraftSelect>
          </FormField>
          <Choice label="Unidade" resource="units" value={unitId} onChange={setUnitId} />
          <Choice
            label="Profissional"
            resource="professionals"
            value={professionalId}
            onChange={setProfessionalId}
          />
        </div>
      </div>
    </DraftForm>
  );
}
