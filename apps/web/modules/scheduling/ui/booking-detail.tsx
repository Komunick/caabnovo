"use client";
import { useEffectiveDeletion } from "@/components/use-effective-deletion";
import { useModulePermission } from "@/components/workspace-permissions";
import { useDraftState } from "@/components/workspace-drafts";
import { useState } from "react";
import type { SchedulingBooking, SchedulingEvent, SchedulingPage } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BookingForm } from "./booking-form";
import {
  DataState,
  Pagination,
  SchedulingShell,
  dateTimeLabel,
  useSchedulingData,
  useSchedulingMutation,
} from "./shared";
type Details = { booking: SchedulingBooking; history: SchedulingPage<SchedulingEvent> };
export function SchedulingBookingDetail({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const [rescheduling, setRescheduling] = useDraftState("booking-detail:rescheduling", false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const result = useSchedulingData<Details>(`bookings/${id}?page=${page}`);
  const canWrite = useModulePermission("scheduling:write");
  const mutation = useSchedulingMutation("booking-detail");
  const booking = result.data?.booking;
  const memberDeleted = useEffectiveDeletion(
    booking?.memberDeletionEffectiveAt,
    booking?.memberDeleted,
  );
  async function cancel() {
    if (
      booking &&
      (await mutation.mutate(`bookings/${id}/cancel`, "POST", { expectedVersion: booking.version }))
    ) {
      setCancelOpen(false);
      setNotice("Reserva cancelada. O horário foi liberado.");
      setRescheduling(false);
      result.reload();
    }
  }
  return (
    <SchedulingShell
      title="Detalhes da reserva"
      description="Confira o atendimento e o histórico de alterações."
    >
      {notice && (
        <p className="scheduling-notice" role="status">
          {notice}
        </p>
      )}
      {booking && result.data ? (
        <>
          <section className="panel scheduling-form">
            <h2>{booking.memberName}</h2>
            {memberDeleted && (
              <section className="scheduling-notice" aria-label="Associado excluído">
                <p>
                  <strong>Associado excluído</strong>. A reserva foi preservada. O responsável pelo
                  agendamento pode mantê-la ou cancelá-la.
                </p>
                {booking.keptAfterMemberDeletion ? (
                  <p>
                    Reserva mantida por {booking.memberDeletionKeptBy} em{" "}
                    {dateTimeLabel(booking.memberDeletionKeptAt!)}.
                  </p>
                ) : (
                  canWrite &&
                  booking.status === "scheduled" &&
                  Date.parse(booking.startsAt) > Date.now() && (
                    <Button
                      disabled={mutation.pending}
                      onClick={async () => {
                        if (
                          await mutation.mutate(`bookings/${id}/keep`, "POST", {
                            expectedVersion: booking.version,
                            deletionEffectiveAt: booking.memberDeletionEffectiveAt,
                          })
                        ) {
                          setNotice("Decisão registrada. A reserva e o horário foram mantidos.");
                          result.reload();
                        }
                      }}
                    >
                      Manter reserva
                    </Button>
                  )
                )}
                {mutation.error && <p role="alert">{mutation.error}</p>}
              </section>
            )}
            <dl className="scheduling-details">
              <div>
                <dt>Atendimento</dt>
                <dd>
                  {booking.procedureName} · {booking.durationMinutes} min
                </dd>
              </div>
              <div>
                <dt>Início</dt>
                <dd>{dateTimeLabel(booking.startsAt)}</dd>
              </div>
              <div>
                <dt>Fim</dt>
                <dd>{dateTimeLabel(booking.endsAt)}</dd>
              </div>
              <div>
                <dt>Unidade e serviço</dt>
                <dd>
                  {booking.unitName} · {booking.serviceName}
                </dd>
              </div>
              <div>
                <dt>Profissional</dt>
                <dd>{booking.professionalName}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{booking.status === "scheduled" ? "Agendado" : "Cancelado"}</dd>
              </div>
            </dl>
            {canWrite &&
            booking.status === "scheduled" &&
            new Date(booking.startsAt).getTime() > Date.now() ? (
              <div className="scheduling-actions">
                <Button disabled={memberDeleted} onClick={() => setRescheduling((value) => !value)}>
                  {rescheduling ? "Fechar remarcação" : "Remarcar"}
                </Button>
                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <DialogTrigger asChild>
                    <Button intent="danger">Cancelar reserva</Button>
                  </DialogTrigger>
                  <DialogContent
                    title="Cancelar esta reserva?"
                    description={`${booking.memberName} · ${booking.procedureName} · ${dateTimeLabel(booking.startsAt)}. O horário ficará disponível e o histórico será preservado.`}
                  >
                    {mutation.error && <p role="alert">{mutation.error}</p>}
                    <div className="scheduling-actions">
                      <DialogClose asChild>
                        <Button disabled={!canWrite || mutation.pending}>Manter reserva</Button>
                      </DialogClose>
                      <Button
                        intent="danger"
                        disabled={!canWrite || mutation.pending}
                        onClick={cancel}
                      >
                        {mutation.pending ? "Cancelando…" : "Confirmar cancelamento"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <p>Esta reserva não permite novas alterações.</p>
            )}
          </section>
          {rescheduling && canWrite && !memberDeleted && (
            <section className="panel">
              <h2>Remarcar atendimento</h2>
              <BookingForm
                key={booking.version}
                booking={booking}
                onSaved={() => {
                  setRescheduling(false);
                  setNotice("Reserva remarcada.");
                  setPage(1);
                  result.reload();
                }}
              />
            </section>
          )}
          <section className="panel">
            <h2>Histórico</h2>
            <ol className="scheduling-history">
              {result.data.history.items.map((event) => (
                <li key={event.id}>
                  <strong>
                    {
                      {
                        created: "Reserva criada",
                        rescheduled: "Reserva remarcada",
                        cancelled: "Reserva cancelada",
                        kept_after_member_deletion: "Reserva mantida após exclusão do associado",
                      }[event.action]
                    }
                  </strong>
                  <p>
                    {dateTimeLabel(event.occurredAt)} · {event.actorName}
                  </p>
                  {event.before?.startsAt && (
                    <p>
                      Antes: {dateTimeLabel(event.before.startsAt)} ·{" "}
                      {event.before.professionalName} · {event.before.procedureName}
                    </p>
                  )}
                  {event.after.startsAt && (
                    <p>
                      {event.action === "cancelled" ? "Horário liberado" : "Atendimento"}:{" "}
                      {dateTimeLabel(event.after.startsAt)} · {event.after.professionalName} ·{" "}
                      {event.after.procedureName}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <Pagination {...result.data.history} onPage={setPage} />
          </section>
        </>
      ) : (
        <DataState error={result.error} reload={result.reload} />
      )}
    </SchedulingShell>
  );
}
