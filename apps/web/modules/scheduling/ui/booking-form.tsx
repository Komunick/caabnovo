"use client";
import { trackPanelEvent } from "@/modules/reports/collector";
import { useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { DraftInput, DraftSelect, DraftForm } from "@/components/ui/draft-controls";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SchedulingBooking, SchedulingSlot } from "@caab/contracts";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { schedulingDate } from "../availability";
import {
  Choice,
  DataState,
  SchedulingShell,
  timeLabel,
  useSchedulingData,
  useSchedulingMutation,
} from "./shared";

export function BookingForm({
  booking,
  onSaved,
}: {
  booking?: SchedulingBooking;
  onSaved?(booking: SchedulingBooking): void;
}) {
  const drafts = useDraftCache();
  const [baseline] = useDraftState("booking-form:baseline", booking);
  const router = useRouter();
  const [memberId, setMemberId] = useDraftState("booking-form:memberId", booking?.memberId ?? "");
  const [unitId, setUnitId] = useDraftState("booking-form:unitId", booking?.unitId ?? "");
  const [serviceId, setServiceId] = useDraftState(
    "booking-form:serviceId",
    booking?.serviceId ?? "",
  );
  const [procedureId, setProcedureId] = useDraftState(
    "booking-form:procedureId",
    booking?.procedureId ?? "",
  );
  const [assignmentId, setAssignmentId] = useDraftState(
    "booking-form:assignmentId",
    booking?.assignmentId ?? "",
  );
  const [date, setDate] = useDraftState(
    "booking-form:date",
    booking ? schedulingDate(booking.startsAt) : schedulingDate(),
  );
  const [startsAt, setStartsAt] = useDraftState("booking-form:startsAt", "");
  const mutation = useSchedulingMutation();
  const slots = useSchedulingData<{ items: SchedulingSlot[]; durationMinutes: number }>(
    assignmentId && date
      ? `availability?assignmentId=${assignmentId}&date=${date}${booking ? `&excludeBookingId=${booking.id}` : ""}`
      : null,
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await mutation.mutate<SchedulingBooking>(
      booking ? `bookings/${booking.id}/reschedule` : "bookings",
      "POST",
      {
        assignmentId,
        startsAt,
        ...(booking ? { expectedVersion: baseline!.version } : { memberId }),
      },
    );
    if (saved) {
      drafts.clear("booking-form:");
      drafts.clear("scheduling-booking-form-1:");
      if (onSaved) onSaved(saved);
      else router.push(`/scheduling/${saved.id}`);
    } else slots.reload();
  }
  return (
    <DraftForm draftKey="scheduling-booking-form-1" className="scheduling-form" onSubmit={submit}>
      <fieldset disabled={mutation.pending} className="scheduling-fields">
        <div>
          <h2>Dados da reserva</h2>
          {booking ? (
            <p>
              <strong>Beneficiário:</strong> {booking.memberName}
            </p>
          ) : (
            <Choice
              label="Beneficiário"
              resource="beneficiaries"
              value={memberId}
              onChange={setMemberId}
              required
            />
          )}
        </div>
        <section aria-labelledby="booking-offer-heading">
          <h2 id="booking-offer-heading">Atendimento</h2>
          <div className="scheduling-grid">
            <Choice
              label="Unidade"
              resource="units"
              filters="active=true"
              selectedLabel={booking?.unitName}
              value={unitId}
              required
              onChange={(value) => {
                setUnitId(value);
                setServiceId("");
                setProcedureId("");
                setAssignmentId("");
                setStartsAt("");
              }}
            />
            <Choice
              key={`service-${unitId}`}
              label="Serviço"
              resource="services"
              filters={`active=true&unitId=${unitId}`}
              selectedLabel={booking?.serviceName}
              disabled={!unitId}
              value={serviceId}
              required
              onChange={(value) => {
                setServiceId(value);
                if (value) trackPanelEvent("service_selected", "scheduling");
                setProcedureId("");
                setAssignmentId("");
                setStartsAt("");
              }}
            />
            <Choice
              key={`procedure-${serviceId}`}
              label="Procedimento"
              resource="procedures"
              filters={`active=true&serviceId=${serviceId}`}
              selectedLabel={booking?.procedureName}
              disabled={!serviceId}
              value={procedureId}
              required
              onChange={(value) => {
                setProcedureId(value);
                setAssignmentId("");
                setStartsAt("");
              }}
            />
            <Choice
              key={`assignment-${procedureId}`}
              label="Profissional habilitado"
              resource="assignments"
              filters={`active=true&procedureId=${procedureId}&unitId=${unitId}`}
              selectedLabel={booking?.professionalName}
              disabled={!procedureId}
              value={assignmentId}
              required
              onChange={(value) => {
                setAssignmentId(value);
                setStartsAt("");
              }}
            />
          </div>
        </section>
        <section aria-labelledby="booking-time-heading" className="scheduling-form">
          <h2 id="booking-time-heading">Data e horário</h2>
          <FormField id="booking-date" label="Data do atendimento">
            <DraftInput
              type="date"
              required
              min={schedulingDate()}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setStartsAt("");
              }}
            />
          </FormField>
          <p>
            Horário de Salvador (America/Bahia). A disponibilidade será conferida novamente ao
            confirmar.
          </p>
          {assignmentId && date ? (
            slots.data ? (
              <>
                <FormField id="booking-slot" label="Vaga disponível">
                  <DraftSelect
                    required
                    value={startsAt}
                    onChange={(event) => {
                      setStartsAt(event.target.value);
                      trackPanelEvent("slot_selected", "scheduling");
                    }}
                  >
                    <option value="">Selecione um horário</option>
                    {startsAt && !slots.data.items.some((slot) => slot.startsAt === startsAt) && (
                      <option value={startsAt} disabled>
                        Horário selecionado indisponível
                      </option>
                    )}
                    {slots.data.items.map((slot) => (
                      <option key={slot.startsAt} value={slot.startsAt}>
                        {timeLabel(slot.startsAt)} às {timeLabel(slot.endsAt)}
                      </option>
                    ))}
                  </DraftSelect>
                </FormField>
                <p>
                  {slots.data.durationMinutes} minutos por atendimento.
                  {!slots.data.items.length &&
                    " Sem vagas nessa data. Confira outra data ou a configuração de horários."}
                </p>
                <Button onClick={slots.reload}>Atualizar vagas</Button>
              </>
            ) : (
              <DataState error={slots.error} reload={slots.reload} />
            )
          ) : (
            <p>Selecione a oferta para consultar as vagas.</p>
          )}
        </section>
      </fieldset>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      <Button
        intent="primary"
        type="submit"
        disabled={
          mutation.pending ||
          !startsAt ||
          !slots.data?.items.some((slot) => slot.startsAt === startsAt)
        }
      >
        {mutation.pending ? "Confirmando…" : booking ? "Confirmar remarcação" : "Confirmar reserva"}
      </Button>
    </DraftForm>
  );
}
export function SchedulingNewBooking() {
  return (
    <SchedulingShell
      title="Nova reserva"
      description="Localize o beneficiário, escolha o atendimento e confirme uma vaga futura."
      action={
        <Link href="/scheduling" className={buttonVariants()}>
          <ArrowLeft size={18} aria-hidden="true" /> Voltar para agenda
        </Link>
      }
    >
      <section className="panel">
        <BookingForm />
      </section>
    </SchedulingShell>
  );
}
