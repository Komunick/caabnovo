"use client";
import { DraftForm } from "@/components/ui/draft-controls";
import { useEffect, useState } from "react";
import type { MemberRecord } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { administrativeStatusLabels, formatMemberDate } from "./labels";
import styles from "./members.module.css";

const actions = {
  inactive: { action: "activate", label: "Ativar associado", confirm: "Confirmar ativação" },
  active: { action: "block", label: "Bloquear associado", confirm: "Confirmar bloqueio" },
  blocked: { action: "unblock", label: "Desbloquear associado", confirm: "Confirmar desbloqueio" },
} as const;

export function MemberAdministrativeStatus({
  member,
  busy,
  canReview,
  command,
}: {
  member: MemberRecord;
  busy: boolean;
  canReview: boolean;
  command(input: Record<string, unknown>): Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const choice = actions[member.administrativeStatus];
  const decision = member.administrativeDecision;
  return (
    <section className="panel" aria-labelledby="administrative-heading">
      <h2 id="administrative-heading">Situação administrativa</h2>
      <p>
        <strong>{administrativeStatusLabels[member.administrativeStatus]}</strong>
      </p>
      {decision ? (
        <>
          <p>{decision.reason}</p>
          <p>
            {decision.actorName} · {formatMemberDate(decision.changedAt)}
          </p>
        </>
      ) : (
        <p>Ainda não há uma decisão de ativação registrada.</p>
      )}
      {member.administrativeStatus === "blocked" && (
        <p>
          Associado bloqueado. O cadastro e os documentos continuam disponíveis para regularização.
        </p>
      )}
      <p>
        A situação administrativa não altera automaticamente avaliações, OAB, finanças ou
        dependentes.
      </p>
      {member.archivedAt ? (
        <p>Restaure o cadastro antes de alterar a situação administrativa.</p>
      ) : (
        canReview &&
        (confirming ? (
          <DraftForm
            draftKey="members-member-administrative-status-1"
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              if (await command({ action: choice.action })) setConfirming(false);
            }}
          >
            <fieldset disabled={busy || !hydrated}>
              <legend>{choice.label}</legend>
              <p>
                Confirme a alteração de {administrativeStatusLabels[member.administrativeStatus]}{" "}
                para {choice.action === "block" ? "Bloqueado" : "Ativo"}.
              </p>

              <div className={styles.actions}>
                <Button type="submit" intent={choice.action === "block" ? "danger" : "primary"}>
                  {choice.confirm}
                </Button>
                <Button type="button" onClick={() => setConfirming(false)}>
                  Cancelar
                </Button>
              </div>
            </fieldset>
          </DraftForm>
        ) : (
          <Button
            disabled={busy || !hydrated}
            intent={choice.action === "block" ? "danger" : "primary"}
            onClick={() => setConfirming(true)}
          >
            {choice.label}
          </Button>
        ))
      )}
    </section>
  );
}
