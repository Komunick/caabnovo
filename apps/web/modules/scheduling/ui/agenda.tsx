"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SchedulingBooking, SchedulingPage } from "@caab/contracts";
import { Button } from "@/components/ui/button";
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
      description="Consulte os atendimentos por dia e acompanhe cada reserva. Horário de Salvador (America/Bahia)."
    >
      <AgendaFilters key={query.toString()} initial={new URLSearchParams(query)} date={date} />
      <section className="panel">
        <h2>Reservas do dia</h2>
        {result.data ? (
          <>
            <ul className="scheduling-list">
              {result.data.items.map((booking) => (
                <li key={booking.id}>
                  <div>
                    <strong>
                      {timeLabel(booking.startsAt)} às {timeLabel(booking.endsAt)} ·{" "}
                      {booking.memberName}
                    </strong>
                    <p>
                      {booking.serviceName} · {booking.procedureName} · {booking.professionalName}
                    </p>
                    <p>
                      {booking.unitName} ·{" "}
                      {booking.status === "scheduled" ? "Agendado" : "Cancelado"}
                    </p>
                  </div>
                  <Link href={`/scheduling/${booking.id}`}>
                    Ver reserva
                    <span className="sr-only">
                      {" "}
                      de {booking.memberName} às {timeLabel(booking.startsAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {!result.data.total && <p>Nenhuma reserva encontrada para esses filtros.</p>}
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
  const router = useRouter();
  const [unitId, setUnitId] = useState(initial.get("unitId") ?? "");
  const [professionalId, setProfessionalId] = useState(initial.get("professionalId") ?? "");
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
    <form className="panel page-stack" onSubmit={submit}>
      <div className="scheduling-grid">
        <FormField id="agenda-date" label="Data">
          <input name="date" type="date" required defaultValue={date} />
        </FormField>
        <FormField id="agenda-person" label="Nome do beneficiário">
          <input name="q" type="search" maxLength={160} defaultValue={initial.get("q") ?? ""} />
        </FormField>
        <FormField id="agenda-status" label="Estado">
          <select name="status" defaultValue={initial.get("status") ?? ""}>
            <option value="">Todos</option>
            <option value="scheduled">Agendado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </FormField>
        <Choice label="Unidade" resource="units" value={unitId} onChange={setUnitId} />
        <Choice
          label="Profissional"
          resource="professionals"
          value={professionalId}
          onChange={setProfessionalId}
        />
      </div>
      <div className="scheduling-actions">
        <Button intent="primary" type="submit">
          Aplicar filtros
        </Button>
        <Link href="/scheduling">Limpar filtros</Link>
      </div>
    </form>
  );
}
