"use client";
import { useModulePermission } from "@/components/workspace-permissions";
import { trackPanelEvent } from "@/modules/reports/collector";
import { useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { DraftInput, DraftSelect, DraftForm } from "@/components/ui/draft-controls";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  schedulingPolicySchema,
  type SchedulingPolicy,
  type SchedulingBooking,
  type SchedulingSlot,
} from "@caab/contracts";
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
    booking?.startsAt ? schedulingDate(booking.startsAt) : schedulingDate(),
  );
  const [startsAt, setStartsAt] = useDraftState("booking-form:startsAt", "");
  const canWrite = useModulePermission("scheduling:write");
  const mutation = useSchedulingMutation("booking-form");
  const settings = useSchedulingData<{
    policy: SchedulingPolicy;
    publishedRevision: { policy: SchedulingPolicy } | null;
  }>(serviceId ? `services/${serviceId}/policy` : null);
  const policy = schedulingPolicySchema.parse(
    settings.data?.publishedRevision?.policy ?? settings.data?.policy ?? {},
  );
  const [anyProfessional, setAnyProfessional] = useDraftState(
    "booking-form:anyProfessional",
    false,
  );
  const automatic =
    policy.mode === "professional" && (!policy.allowProfessionalChoice || anyProfessional);
  const professionals = useSchedulingData<{ total: number }>(
    procedureId && policy.mode === "professional"
      ? `assignments?active=true&procedureId=${procedureId}&pageSize=1`
      : null,
  );
  const hasProfessionals = (professionals.data?.total ?? 0) > 0;
  const slots = useSchedulingData<{ items: SchedulingSlot[]; durationMinutes: number }>(
    procedureId &&
      settings.data &&
      date &&
      (policy.mode === "capacity" || automatic || assignmentId)
      ? `availability?procedureId=${procedureId}${assignmentId && !automatic && policy.mode === "professional" ? `&assignmentId=${assignmentId}` : ""}&date=${date}${memberId ? `&beneficiaryId=${memberId}` : ""}${booking ? `&excludeBookingId=${booking.id}` : ""}`
      : null,
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await mutation.mutate<SchedulingBooking>(
      booking
        ? `bookings/${booking.id}/${booking.status === "pending_approval" ? "pending" : booking.status === "awaiting_new_time" ? "resume" : "reschedule"}`
        : "bookings",
      "POST",
      {
        procedureId,
        ...(slots.data?.items.find((slot) => slot.startsAt === startsAt)?.assignmentId
          ? {
              assignmentId: slots.data.items.find((slot) => slot.startsAt === startsAt)!
                .assignmentId,
            }
          : {}),
        startsAt,
        ...(booking
          ? {
              expectedVersion: baseline!.version,
              ...(booking.status === "pending_approval" &&
              !booking.processKind &&
              memberId !== booking.memberId
                ? { memberId }
                : {}),
            }
          : { memberId }),
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
      <fieldset disabled={!canWrite || mutation.pending} className="scheduling-fields">
        <div>
          <h2>Dados da reserva</h2>
          {booking ? (
            <div>
              <p>
                <strong>Beneficiário:</strong> {booking.memberName}
              </p>
              {booking.status === "pending_approval" && !booking.processKind && (
                <Choice
                  label="Transferir para dependente (opcional)"
                  resource="beneficiaries"
                  filters={`holderId=${booking.memberId}`}
                  value={memberId === booking.memberId ? "" : memberId}
                  onChange={(value) => {
                    setMemberId(value || booking.memberId);
                    setStartsAt("");
                  }}
                />
              )}
            </div>
          ) : (
            <Choice
              label="Beneficiário"
              resource="beneficiaries"
              value={memberId}
              onChange={(value) => {
                setMemberId(value);
                setStartsAt("");
              }}
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
              disabled={!!booking}
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
              filters={`catalogView=booking&active=true&unitId=${unitId}${memberId ? `&beneficiaryId=${memberId}` : ""}`}
              selectedLabel={booking?.serviceName}
              disabled={!unitId || !!booking}
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
            {policy.mode === "professional" &&
              policy.allowProfessionalChoice &&
              hasProfessionals && (
                <label className="checkbox-field">
                  <DraftInput
                    type="checkbox"
                    checked={anyProfessional}
                    onChange={(event) => {
                      setAnyProfessional(event.target.checked);
                      setAssignmentId("");
                      setStartsAt("");
                    }}
                  />
                  Qualquer profissional disponível
                </label>
              )}
            <Choice
              key={`procedure-${serviceId}`}
              label="Procedimento"
              resource="procedures"
              filters={`catalogView=booking&active=true&serviceId=${serviceId}`}
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
            {policy.mode === "professional" &&
              policy.allowProfessionalChoice &&
              hasProfessionals &&
              !anyProfessional && (
                <Choice
                  key={`assignment-${procedureId}`}
                  label="Profissional habilitado"
                  resource="assignments"
                  filters={`active=true&procedureId=${procedureId}&unitId=${unitId}`}
                  selectedLabel={booking?.professionalName ?? undefined}
                  disabled={!procedureId}
                  value={assignmentId}
                  required
                  onChange={(value) => {
                    setAssignmentId(value);
                    setStartsAt("");
                  }}
                />
              )}
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
          {procedureId && date && (policy.mode === "capacity" || automatic || assignmentId) ? (
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
                        {automatic && slot.professionalName ? ` · ${slot.professionalName}` : ""}
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
            <p>
              {procedureId && professionals.data && !hasProfessionals
                ? "Nenhum profissional habilitado. Confira a configuração do serviço e dos horários."
                : "Selecione a oferta e o profissional, quando necessário, para consultar as vagas."}
            </p>
          )}
        </section>
      </fieldset>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {booking?.status === "scheduled" && (
        <p>
          Ao enviar a remarcação, a vaga anterior será liberada e poderá ser ocupada por outra
          pessoa. Somente a nova vaga ficará reservada.
        </p>
      )}
      <p>
        {policy.immediateConfirmation
          ? "A reserva será confirmada imediatamente."
          : "O pedido ocupará a vaga e aguardará aprovação da equipe."}
      </p>
      <Button
        intent="primary"
        type="submit"
        disabled={
          !canWrite ||
          mutation.pending ||
          !startsAt ||
          !slots.data?.items.some((slot) => slot.startsAt === startsAt)
        }
      >
        {mutation.pending
          ? "Salvando…"
          : booking?.status === "pending_approval"
            ? "Salvar pedido"
            : !policy.immediateConfirmation
              ? "Enviar pedido"
              : booking
                ? "Confirmar remarcação"
                : "Confirmar reserva"}
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
