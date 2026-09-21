"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import themePlugin from "@fullcalendar/react/themes/classic";
import ptBr from "@fullcalendar/react/locales/pt-br";
import type { SchedulingBooking } from "@caab/contracts";
import { useRouter } from "next/navigation";
import { calendarRange, type CalendarView } from "../calendar";
import { DataState, timeLabel, useSchedulingData } from "./shared";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "./calendar.css";

const views = { day: "timeGridDay", week: "timeGridWeek", month: "dayGridMonth" };
export default function SchedulingCalendar({
  date,
  view,
  filters,
}: {
  date: string;
  view: Exclude<CalendarView, "list">;
  filters: string;
}) {
  const router = useRouter();
  const range = calendarRange(date, view);
  const query = new URLSearchParams(filters);
  query.set("start", range.start);
  query.set("end", range.end);
  const result = useSchedulingData<{ items: SchedulingBooking[] }>(`calendar?${query}`);
  if (!result.data) return <DataState error={result.error} reload={result.reload} />;
  const events = result.data.items.map((booking) => {
    const status = `${booking.status === "scheduled" ? "Agendado" : "Cancelado"}${booking.memberDeleted ? " · Associado excluído" : ""}`;
    const label = `${booking.memberName}, ${timeLabel(booking.startsAt)} às ${timeLabel(booking.endsAt)}, ${booking.procedureName}, ${booking.professionalName}, ${booking.unitName}, ${status}`;
    return {
      id: booking.id,
      start: booking.startsAt,
      end: booking.endsAt,
      title: `${status} · ${booking.memberName} · ${booking.procedureName} · ${booking.professionalName}`,
      url: `/scheduling/${booking.id}`,
      extendedProps: { label, status: booking.status },
    };
  });
  return (
    <>
      <p role="status">
        {events.length
          ? `${events.length} reserva(s) no período exibido.`
          : "Nenhuma reserva encontrada neste período e filtros."}
      </p>
      <p className="scheduling-muted">
        Horário da Bahia. Abra uma reserva para consultar, remarcar ou cancelar. Para consultar
        vagas, use Nova reserva.
      </p>
      <div
        className={`scheduling-calendar scheduling-calendar--${view}`}
        role="region"
        aria-label="Calendário de reservas"
        tabIndex={0}
      >
        <FullCalendar
          key={`${date}:${view}`}
          plugins={[themePlugin, dayGridPlugin, timeGridPlugin]}
          initialView={views[view]}
          initialDate={date}
          locale={ptBr}
          timeZone="America/Bahia"
          firstDay={0}
          headerToolbar={false}
          height={view === "month" ? "auto" : 600}
          fixedWeekCount={true}
          allDaySlot={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:30:00"
          scrollTime="08:00:00"
          editable={false}
          selectable={false}
          eventInteractive={true}
          events={events}
          eventDisplay="block"
          dayMaxEvents={3}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          slotHeaderFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          eventClass={(info) =>
            info.event.extendedProps.status === "cancelled"
              ? "scheduling-calendar-event scheduling-calendar-event--cancelled"
              : "scheduling-calendar-event"
          }
          eventDidMount={(info) => {
            info.el.setAttribute("aria-label", String(info.event.extendedProps.label));
            info.el.setAttribute("title", String(info.event.extendedProps.label));
          }}
          eventClick={(info) => {
            // Preserve native open-in-new-tab behavior for modified clicks.
            if (
              info.jsEvent.ctrlKey ||
              info.jsEvent.metaKey ||
              info.jsEvent.shiftKey ||
              info.jsEvent.altKey
            )
              return;
            info.jsEvent.preventDefault();
            router.push(`/scheduling/${info.event.id}`);
          }}
        />
      </div>
    </>
  );
}
