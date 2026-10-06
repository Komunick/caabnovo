"use client";
import { useEffect, useRef, useState } from "react";
import {
  schedulingAbsenceStatusLabels,
  type SchedulingAbsence,
  type SchedulingAbsenceAppealKind,
  type SchedulingAbsenceDecisionOutcome,
  type SchedulingAbsenceListItem,
  type SchedulingBooking,
  type SchedulingPage,
} from "@caab/contracts";
import { useModulePermission, useWorkspacePermissions } from "@/components/workspace-permissions";
import { useDraftCache, useDraftState } from "@/components/workspace-drafts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import {
  DataState,
  dateTimeLabel,
  schedulingRequest,
  useSchedulingData,
  useSchedulingMutation,
} from "./shared";
import { AbsenceEvidenceUpload, type AbsenceEvidenceDraft } from "./absence-evidence-upload";

type AppealDraft = {
  kind: SchedulingAbsenceAppealKind;
  explanation: string;
  version: number;
  evidence?: AbsenceEvidenceDraft;
};
type Review = {
  id: string;
  kind: SchedulingAbsenceAppealKind;
  explanation: string;
  evidence: { id: string; name: string; available: boolean }[];
};

export function BookingAbsence({
  booking,
  onChanged,
}: {
  booking: SchedulingBooking;
  onChanged(): void;
}) {
  const canWrite = useModulePermission("scheduling:write");
  const result = useSchedulingData<SchedulingPage<SchedulingAbsenceListItem>>(
    `absences?bookingId=${booking.id}`,
  );
  const mutation = useSchedulingMutation(`absence-record:${booking.id}`);
  const [recordOpen, setRecordOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (window.location.hash === "#falta") {
      document.getElementById("falta")?.scrollIntoView({ block: "start" });
      title.current?.focus({ preventScroll: true });
    }
  }, [booking.id]);
  const occurrence = result.data?.items[0];
  const eligible =
    booking.status === "scheduled" && booking.endsAt && Date.parse(booking.endsAt) <= Date.now();
  function changed() {
    result.reload();
    onChanged();
  }
  return (
    <section id="falta" className="panel scheduling-form" aria-labelledby="booking-absence-title">
      <h2 id="booking-absence-title" tabIndex={-1} ref={title}>
        Falta ao atendimento
      </h2>
      {result.data && <Button onClick={result.reload}>Atualizar falta</Button>}
      {notice && <p role="status">{notice}</p>}
      {!result.data ? (
        <DataState error={result.error} reload={result.reload} />
      ) : occurrence ? (
        <AbsenceDetails key={occurrence.id} occurrence={occurrence} onChanged={changed} />
      ) : (
        <>
          <p>Nenhuma falta registrada para esta reserva.</p>
          {canWrite && eligible && (
            <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
              <DialogTrigger asChild>
                <Button>Registrar falta</Button>
              </DialogTrigger>
              <DialogContent
                title="Registrar falta ao atendimento?"
                description={`${booking.memberName} · ${booking.procedureName} · ${dateTimeLabel(booking.startsAt)}.`}
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  title.current?.focus();
                }}
              >
                <p>
                  O registro impede novas reservas desta pessoa em todos os serviços por 30 dias
                  corridos, a partir de agora. Ela terá sete dias corridos para justificar ou
                  contestar.
                </p>
                <p>
                  As reservas existentes permanecem válidas durante esse prazo e durante a análise.
                  Sem pedido no prazo, ou em caso de rejeição, as reservas futuras dentro dos 30
                  dias serão canceladas.
                </p>
                {mutation.error && <p role="alert">{mutation.error}</p>}
                <div className="scheduling-actions">
                  <DialogClose asChild>
                    <Button disabled={mutation.pending}>Voltar</Button>
                  </DialogClose>
                  <Button
                    intent="danger"
                    disabled={mutation.pending}
                    onClick={async () => {
                      if (
                        await mutation.mutate(`bookings/${booking.id}/absence`, "POST", {
                          expectedVersion: booking.version,
                        })
                      ) {
                        setRecordOpen(false);
                        setNotice("Falta registrada. Confira os prazos abaixo.");
                        changed();
                      }
                    }}
                  >
                    {mutation.pending ? "Registrando…" : "Confirmar registro da falta"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {canWrite && !eligible && (
            <p>
              A falta só pode ser registrada em reserva confirmada após o horário previsto de
              término.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function AbsenceDetails({
  occurrence,
  onChanged,
}: {
  occurrence: SchedulingAbsence;
  onChanged(): void;
}) {
  const permissions = useWorkspacePermissions();
  const draftCache = useDraftCache();
  const canWrite =
    permissions.includes("scheduling:read") && permissions.includes("scheduling:write");
  const canReview =
    permissions.includes("scheduling:read") && permissions.includes("scheduling:review_absences");
  const canUpload = ["members:read", "members:write", "files:read", "files:create"].every(
    (permission) => permissions.includes(permission),
  );
  const [showNotice, setShowNotice] = useState(true);
  const [editing, setEditing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useDraftState<AppealDraft>(`absence:${occurrence.id}:appeal`, {
    kind: "justification",
    explanation: "",
    version: occurrence.version,
  });
  const [fieldErrors, setFieldErrors] = useDraftState<{ explanation?: string; evidence?: string }>(
    `absence:${occurrence.id}:fields`,
    {},
  );
  const [decision, setDecision] = useState<{
    outcome: SchedulingAbsenceDecisionOutcome;
    version: number;
  } | null>(null);
  const mutation = useSchedulingMutation(`absence:${occurrence.id}`);
  const review = useSchedulingData<Review>(
    canReview && reviewing && occurrence.appeal ? `absences/${occurrence.id}/review` : null,
  );
  const [downloadError, setDownloadError] = useState("");
  const decisionTrigger = useRef<HTMLButtonElement | null>(null);
  const explanation = useRef<HTMLTextAreaElement>(null);
  const submitAllowed =
    occurrence.canSubmitAppeal && Date.now() < Date.parse(occurrence.appealDeadline);
  const restrictionActive =
    occurrence.restrictionActive && Date.now() < Date.parse(occurrence.restrictionEndsAt);
  function openAppeal(kind: SchedulingAbsenceAppealKind) {
    setDraft((previous) => ({ ...previous, kind }));
    setEditing(true);
  }
  return (
    <>
      <dl className="scheduling-details">
        <div>
          <dt>Situação da falta</dt>
          <dd>{schedulingAbsenceStatusLabels[occurrence.status]}</dd>
        </div>
        <div>
          <dt>Registrada em</dt>
          <dd>
            {dateTimeLabel(occurrence.recordedAt)} · {occurrence.recordedByName}
          </dd>
        </div>
        <div>
          <dt>Prazo para justificar ou contestar</dt>
          <dd>{dateTimeLabel(occurrence.appealDeadline)}</dd>
        </div>
        <div>
          <dt>Término dos 30 dias</dt>
          <dd>{dateTimeLabel(occurrence.restrictionEndsAt)}</dd>
        </div>
        <div>
          <dt>Novas reservas por esta falta</dt>
          <dd>{restrictionActive ? "Impedidas" : "Restrição encerrada"}</dd>
        </div>
      </dl>
      {!restrictionActive && (
        <p>Outros impedimentos ou faltas ainda vigentes podem impedir novas reservas.</p>
      )}
      {showNotice && submitAllowed && (
        <div className="scheduling-notice">
          <p>
            A pessoa tem sete dias corridos desde o registro para apresentar justificativa ou
            contestação. O pedido exige explicação e comprovante. As reservas preservadas permitem
            atendimento normal; o envio não libera novas reservas.
          </p>
          <div className="scheduling-actions">
            <Button onClick={() => setShowNotice(false)}>OK</Button>
            {canWrite && (
              <>
                <Button onClick={() => openAppeal("justification")}>Justificar falta</Button>
                <Button onClick={() => openAppeal("contestation")}>Contestar falta</Button>
              </>
            )}
          </div>
        </div>
      )}
      {!showNotice && canWrite && submitAllowed && (
        <div className="scheduling-actions">
          <Button onClick={() => openAppeal("justification")}>Justificar falta</Button>
          <Button onClick={() => openAppeal("contestation")}>Contestar falta</Button>
        </div>
      )}
      {occurrence.appeal && (
        <p>
          {occurrence.appeal.kind === "justification" ? "Justificativa" : "Contestação"} apresentada
          em {dateTimeLabel(occurrence.appeal.submittedAt)} por {occurrence.appeal.submittedByName}.
          {occurrence.appeal.decidedAt && (
            <>
              {" "}
              Decisão em {dateTimeLabel(occurrence.appeal.decidedAt)} por{" "}
              {occurrence.appeal.decidedByName}.
            </>
          )}
        </p>
      )}
      {occurrence.status === "under_review" && (
        <p>
          Pedido em análise pela equipe responsável. As reservas existentes permanecem válidas. A
          análise não prolonga os 30 dias de restrição.
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {editing && canWrite && (
        <form
          className="scheduling-form"
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();
            const errors = {
              explanation: draft.explanation.trim()
                ? undefined
                : "Explique a justificativa ou contestação.",
              evidence: draft.evidence?.available
                ? undefined
                : "Anexe pelo menos um comprovante liberado pela verificação de segurança.",
            };
            setFieldErrors(errors);
            if (errors.explanation || errors.evidence) {
              if (errors.explanation) explanation.current?.focus();
              else document.getElementById(`absence-${occurrence.id}-file`)?.focus();
              return;
            }
            if (!submitAllowed || !canUpload || draft.version !== occurrence.version) return;
            if (
              await mutation.mutate(`absences/${occurrence.id}/appeal`, "POST", {
                expectedVersion: draft.version,
                kind: draft.kind,
                explanation: draft.explanation,
                evidenceFileIds: [draft.evidence!.id],
              })
            ) {
              setDraft({ kind: "justification", explanation: "", version: occurrence.version });
              setFieldErrors({});
              setEditing(false);
              setNotice("Pedido apresentado para análise pela equipe responsável.");
              onChanged();
            }
          }}
        >
          <h3>{draft.kind === "justification" ? "Justificar falta" : "Contestar falta"}</h3>
          <FormField
            id={`absence-${occurrence.id}-explanation`}
            label="Explicação obrigatória"
            error={fieldErrors.explanation}
          >
            <textarea
              required
              rows={4}
              ref={explanation}
              value={draft.explanation}
              disabled={mutation.pending}
              onChange={(event) => {
                setDraft((previous) => ({ ...previous, explanation: event.target.value }));
                if (fieldErrors.explanation)
                  setFieldErrors((previous) => ({
                    ...previous,
                    explanation: event.target.value.trim()
                      ? undefined
                      : "Explique a justificativa ou contestação.",
                  }));
              }}
            />
          </FormField>
          {canUpload ? (
            <AbsenceEvidenceUpload
              memberId={occurrence.memberId}
              draftKey={`absence-${occurrence.id}`}
              value={draft.evidence}
              disabled={mutation.pending}
              error={fieldErrors.evidence}
              onChange={(evidence) => {
                setDraft((previous) => ({ ...previous, evidence }));
                setFieldErrors((previous) => ({ ...previous, evidence: undefined }));
              }}
            />
          ) : (
            <p>
              Para enviar o comprovante, sua conta precisa das permissões de consulta e alteração de
              Associados e de consulta e envio de arquivos. Solicite o acesso ao responsável.
            </p>
          )}
          {draft.version !== occurrence.version && (
            <div role="alert">
              <p>
                Esta falta foi alterada enquanto o pedido era preparado. O texto foi preservado;
                confira a situação e os prazos antes de continuar.
              </p>
              <Button
                onClick={() =>
                  setDraft((previous) => ({ ...previous, version: occurrence.version }))
                }
              >
                Usar a versão atual após conferir
              </Button>
            </div>
          )}
          {!submitAllowed && (
            <p role="alert">
              O prazo para apresentar este pedido terminou ou já há um pedido apresentado. O
              rascunho foi preservado.
            </p>
          )}
          {mutation.error && <p role="alert">{mutation.error}</p>}
          <div className="scheduling-actions">
            <Button onClick={() => setEditing(false)} disabled={mutation.pending}>
              Fechar formulário
            </Button>
            <Button
              onClick={() => {
                setDraft({ kind: "justification", explanation: "", version: occurrence.version });
                setFieldErrors({});
                draftCache.remove(`absence-${occurrence.id}:upload-error`);
                mutation.clearError();
                setEditing(false);
              }}
              disabled={mutation.pending}
            >
              Descartar rascunho
            </Button>
            <Button
              type="submit"
              intent="primary"
              disabled={
                mutation.pending ||
                !canUpload ||
                !submitAllowed ||
                draft.version !== occurrence.version
              }
            >
              {mutation.pending ? "Enviando…" : "Enviar pedido para análise"}
            </Button>
          </div>
        </form>
      )}
      {canReview && occurrence.appeal && (
        <>
          <Button onClick={() => setReviewing((value) => !value)}>
            {reviewing ? "Fechar análise" : "Consultar pedido e comprovantes"}
          </Button>
          {reviewing && (
            <div className="scheduling-form">
              {!review.data ? (
                <DataState error={review.error} reload={review.reload} />
              ) : (
                <>
                  <h3>
                    {review.data.kind === "justification"
                      ? "Justificativa apresentada"
                      : "Contestação apresentada"}
                  </h3>
                  <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {review.data.explanation}
                  </p>
                  <ul>
                    {review.data.evidence.map((file) => (
                      <li key={file.id} style={{ overflowWrap: "anywhere" }}>
                        {file.name} ·{" "}
                        {file.available ? (
                          <Button
                            onClick={async () => {
                              setDownloadError("");
                              const opened = window.open("", "_blank");
                              if (opened) opened.opener = null;
                              try {
                                const grant = await schedulingRequest<{ url: string }>(
                                  `absences/${occurrence.id}/evidence?fileId=${file.id}`,
                                );
                                if (opened) opened.location.href = grant.url;
                                else
                                  setDownloadError(
                                    "Permita abrir uma nova aba para consultar o comprovante.",
                                  );
                              } catch (error) {
                                opened?.close();
                                setDownloadError(
                                  error instanceof Error
                                    ? error.message
                                    : "Não foi possível abrir o comprovante.",
                                );
                              }
                            }}
                          >
                            Abrir comprovante em nova aba
                          </Button>
                        ) : (
                          "Comprovante indisponível"
                        )}
                      </li>
                    ))}
                  </ul>
                  {downloadError && <p role="alert">{downloadError}</p>}
                  {!occurrence.appeal.outcome && (
                    <div className="scheduling-actions">
                      <Button
                        intent="primary"
                        onClick={(event) => {
                          decisionTrigger.current = event.currentTarget;
                          setDecision({ outcome: "accepted", version: occurrence.version });
                        }}
                      >
                        Aceitar pedido
                      </Button>
                      <Button
                        intent="danger"
                        onClick={(event) => {
                          decisionTrigger.current = event.currentTarget;
                          setDecision({ outcome: "rejected", version: occurrence.version });
                        }}
                      >
                        Rejeitar pedido
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
      <Dialog
        open={!!decision && canReview}
        onOpenChange={(open) => {
          if (!open) setDecision(null);
        }}
      >
        <DialogContent
          title={
            decision?.outcome === "accepted" ? "Aceitar este pedido?" : "Rejeitar este pedido?"
          }
          description={
            decision?.outcome === "accepted"
              ? "A falta aparecerá como Falta abonada. Esta restrição será encerrada, preservando outros impedimentos vigentes."
              : restrictionActive
                ? "As reservas futuras confirmadas e pendentes dentro do período serão canceladas imediatamente. A restrição termina na data original, sem reiniciar os 30 dias."
                : "Os 30 dias já terminaram. A decisão ficará no histórico, sem cancelar reservas nem reiniciar a restrição."
          }
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            decisionTrigger.current?.focus();
          }}
        >
          {mutation.error && <p role="alert">{mutation.error}</p>}
          <div className="scheduling-actions">
            <DialogClose asChild>
              <Button disabled={mutation.pending}>Voltar</Button>
            </DialogClose>
            <Button
              intent={decision?.outcome === "accepted" ? "primary" : "danger"}
              disabled={mutation.pending || !canReview}
              onClick={async () => {
                if (
                  decision &&
                  (await mutation.mutate(`absences/${occurrence.id}/decision`, "POST", {
                    expectedVersion: decision.version,
                    outcome: decision.outcome,
                  }))
                ) {
                  setDecision(null);
                  setNotice("Decisão registrada.");
                  review.reload();
                  onChanged();
                }
              }}
            >
              {mutation.pending ? "Registrando…" : "Confirmar decisão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
