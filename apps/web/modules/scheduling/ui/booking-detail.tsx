"use client";
import { useEffectiveDeletion } from "@/components/use-effective-deletion";
import { useModulePermission } from "@/components/workspace-permissions";
import { useDraftState } from "@/components/workspace-drafts";
import { useRef, useState } from "react";
import type { SchedulingBooking, SchedulingEvent, SchedulingPage } from "@caab/contracts";
import { schedulingStatusLabels } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BookingForm } from "./booking-form";
import { BookingAbsence } from "./booking-absence";
import {
  DataState,
  Pagination,
  SchedulingShell,
  dateTimeLabel,
  useSchedulingData,
  useSchedulingMutation,
} from "./shared";
type Details = { booking: SchedulingBooking; history: SchedulingPage<SchedulingEvent> };
type WorkflowDialogAction = { action: string; title: string; description: string };
export function SchedulingBookingDetail({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const [rescheduling, setRescheduling] = useDraftState("booking-detail:rescheduling", false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [workflowAction, setWorkflowAction] = useState<WorkflowDialogAction | null>(null);
  const workflowTrigger = useRef<HTMLButtonElement>(null);
  function openWorkflowAction(action: WorkflowDialogAction, trigger: HTMLButtonElement) {
    workflowTrigger.current = trigger;
    setWorkflowAction(action);
  }
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
            {booking.eligibilityWarning === "blocked" && (
              <section className="scheduling-notice" aria-label="Beneficiário bloqueado">
                <p>
                  <strong>Beneficiário bloqueado</strong>. O registro foi preservado. Novas reservas
                  e remarcações estão indisponíveis enquanto houver bloqueio. A equipe pode manter
                  esta reserva ou cancelá-la.
                </p>
              </section>
            )}
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
                  Date.parse(booking.startsAt ?? "") > Date.now() && (
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
                <dd>{booking.professionalName ?? "Atendimento por capacidade do serviço"}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{schedulingStatusLabels[booking.status]}</dd>
              </div>
              <div>
                <dt>Remarcações</dt>
                <dd>
                  {booking.confirmedReschedules == null
                    ? "Contagem anterior desconhecida"
                    : `${booking.confirmedReschedules} ${booking.confirmedReschedules === 1 ? "confirmada" : "confirmadas"}`}{" "}
                  · {booking.reservedReschedule ? "1" : "0"} em andamento
                </dd>
              </div>
            </dl>
            {booking.processKind === "recovery" && (
              <p>
                Recuperação por indisponibilidade do estabelecimento. Não consome uma remarcação.
              </p>
            )}
            {booking.status === "awaiting_new_time" && (
              <p>
                A reserva está sem horário confirmado. A vaga anterior não foi restaurada; escolha
                uma nova data ou cancele.
              </p>
            )}
            {canWrite && (
              <div className="scheduling-actions">
                {booking.status === "pending_approval" && (
                  <>
                    <Button
                      disabled={
                        mutation.pending ||
                        memberDeleted ||
                        booking.eligibilityWarning === "blocked" ||
                        Date.parse(booking.startsAt ?? "") <= Date.now()
                      }
                      onClick={(event) =>
                        openWorkflowAction(
                          {
                            action: "approve",
                            title: "Aprovar este pedido?",
                            description:
                              "Confirma o horário solicitado e registra a decisão no histórico.",
                          },
                          event.currentTarget,
                        )
                      }
                    >
                      Aprovar pedido
                    </Button>
                    <Button
                      disabled={mutation.pending}
                      onClick={(event) =>
                        openWorkflowAction(
                          {
                            action: "reject",
                            title: "Recusar este pedido?",
                            description: booking.processKind
                              ? "Libera o destino e mantém a mesma troca aguardando nova escolha. A vaga antiga não será restaurada."
                              : "Encerra o pedido e libera o horário solicitado.",
                          },
                          event.currentTarget,
                        )
                      }
                    >
                      Recusar pedido
                    </Button>
                    {booking.processKind &&
                      Date.parse(booking.originalStart ?? "") > Date.now() && (
                        <Button
                          disabled={mutation.pending}
                          onClick={(event) =>
                            openWorkflowAction(
                              {
                                action: "withdraw",
                                title: "Retirar esta proposta?",
                                description:
                                  "Libera o destino para escolher outra data, sem restaurar a vaga anterior nem consumir outra troca.",
                              },
                              event.currentTarget,
                            )
                          }
                        >
                          Retirar proposta
                        </Button>
                      )}
                  </>
                )}
                {booking.status === "scheduled" && (
                  <Button
                    disabled={mutation.pending}
                    onClick={(event) =>
                      openWorkflowAction(
                        {
                          action: "provider-unavailability",
                          title: "Registrar indisponibilidade do estabelecimento?",
                          description:
                            "Bloqueia o período deste recurso, libera o atendimento e permite recuperar uma nova data sem consumir remarcação. Reservas de outras pessoas serão preservadas.",
                        },
                        event.currentTarget,
                      )
                    }
                  >
                    Estabelecimento não poderá atender
                  </Button>
                )}
              </div>
            )}
            {canWrite &&
            (booking.status === "pending_approval" ||
              booking.status === "awaiting_new_time" ||
              (booking.status === "scheduled" &&
                Date.parse(booking.startsAt ?? "") > Date.now())) ? (
              <div className="scheduling-actions">
                <Button
                  disabled={
                    memberDeleted ||
                    booking.eligibilityWarning === "blocked" ||
                    (booking.status === "scheduled" &&
                      (booking.confirmedReschedules == null || booking.confirmedReschedules >= 2))
                  }
                  onClick={() => setRescheduling((value) => !value)}
                >
                  {rescheduling
                    ? "Fechar edição"
                    : booking.status === "pending_approval"
                      ? "Editar pedido"
                      : booking.status === "awaiting_new_time"
                        ? "Escolher nova data"
                        : "Remarcar"}
                </Button>
                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <DialogTrigger asChild>
                    <Button
                      intent="danger"
                      disabled={
                        booking.status !== "awaiting_new_time" &&
                        Date.parse(
                          (booking.processKind ? booking.originalStart : booking.startsAt) ?? "",
                        ) <= Date.now()
                      }
                    >
                      Cancelar reserva
                    </Button>
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
          {rescheduling &&
            canWrite &&
            !memberDeleted &&
            booking.eligibilityWarning !== "blocked" && (
              <section className="panel">
                <h2>Remarcar atendimento</h2>
                <BookingForm
                  key={booking.version}
                  booking={booking}
                  onSaved={(saved) => {
                    setRescheduling(false);
                    setNotice(
                      saved.status === "scheduled"
                        ? "Reserva remarcada."
                        : "Pedido atualizado. Confira a situação da reserva.",
                    );
                    setPage(1);
                    result.reload();
                  }}
                />
              </section>
            )}
          <BookingAbsence booking={booking} onChanged={result.reload} />
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
                        pending_edited: "Pedido editado",
                        transferred: "Atendimento transferido para dependente",
                        approved: "Pedido aprovado",
                        rejected: "Pedido recusado",
                        reschedule_requested: "Remarcação solicitada",
                        proposal_withdrawn: "Proposta retirada",
                        resumed: "Nova data solicitada",
                        provider_unavailable: "Indisponibilidade do estabelecimento registrada",
                      }[event.action]
                    }
                  </strong>
                  <p>
                    {dateTimeLabel(event.occurredAt)} · {event.actorName}
                  </p>
                  {event.notifications?.map((notification) => (
                    <p key={notification.kind}>
                      Aviso de{" "}
                      {
                        {
                          confirmed: "confirmação",
                          rejected: "recusa",
                          cancelled: "cancelamento",
                          reschedule_required: "nova data necessária",
                        }[notification.kind]
                      }
                      :
                      {
                        {
                          pending: " envio pendente",
                          suppressed: " não enviado",
                          delivered: " entrega comprovada",
                          failed: " envio falhou",
                          uncertain: " entrega não comprovada",
                        }[notification.status]
                      }
                      .
                    </p>
                  ))}
                  {event.before?.startsAt && (
                    <p>
                      Antes:{" "}
                      {[
                        dateTimeLabel(event.before.startsAt),
                        event.before.professionalName,
                        event.before.procedureName,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {event.after.startsAt && (
                    <p>
                      {event.action === "cancelled" ? "Horário liberado" : "Atendimento"}:{" "}
                      {[
                        dateTimeLabel(event.after.startsAt),
                        event.after.professionalName,
                        event.after.procedureName,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <Pagination {...result.data.history} onPage={setPage} />
          </section>
          <Dialog
            open={!!workflowAction}
            onOpenChange={(open) => {
              if (!open) setWorkflowAction(null);
            }}
          >
            <DialogContent
              title={workflowAction?.title ?? "Confirmar ação"}
              description={workflowAction?.description ?? ""}
              onCloseAutoFocus={(event) => {
                const trigger = workflowTrigger.current;
                if (trigger?.isConnected && !trigger.disabled) {
                  event.preventDefault();
                  trigger.focus({ preventScroll: true });
                }
              }}
            >
              {mutation.error && <p role="alert">{mutation.error}</p>}
              <div className="scheduling-actions">
                <DialogClose asChild>
                  <Button disabled={mutation.pending}>Voltar</Button>
                </DialogClose>
                <Button
                  intent="primary"
                  disabled={!canWrite || mutation.pending}
                  onClick={async () => {
                    if (
                      workflowAction &&
                      (await mutation.mutate(`bookings/${id}/${workflowAction.action}`, "POST", {
                        expectedVersion: booking.version,
                      }))
                    ) {
                      setWorkflowAction(null);
                      setRescheduling(false);
                      setNotice("Decisão registrada.");
                      setPage(1);
                      result.reload();
                    }
                  }}
                >
                  Confirmar decisão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <DataState error={result.error} reload={result.reload} />
      )}
    </SchedulingShell>
  );
}
