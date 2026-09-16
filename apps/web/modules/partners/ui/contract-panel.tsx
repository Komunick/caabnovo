"use client";
import { useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { DraftInput, DraftTextarea, DraftForm } from "@/components/ui/draft-controls";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { PartnerRecord } from "@caab/contracts";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ContractFiles } from "./contract-files";
import type { PartnerCommandHandler } from "./client";
import { formatDate, statusLabels } from "./labels";
import styles from "./partners.module.css";
export function ContractPanel({
  partner,
  disabled,
  canWrite,
  canPublish,
  canReadFiles,
  canUpload,
  command,
}: {
  partner: PartnerRecord;
  disabled: boolean;
  canWrite: boolean;
  canPublish: boolean;
  canReadFiles: boolean;
  canUpload: boolean;
  command: PartnerCommandHandler;
}) {
  const drafts = useDraftCache();
  const close = () => {
    drafts.clear("partners-contract-panel-1:");
    setFileId("");
    setAdding(false);
  };
  const [adding, setAdding] = useDraftState("contract-panel:adding", false);
  const [fileId, setFileId] = useDraftState("contract-panel:fileId", "");
  const [decision, setDecision] = useState<{ id: string; status: "approved" | "ended" } | null>(
    null,
  );
  return (
    <section className="panel">
      <h2>Contratos</h2>
      <p>
        Registre as condições e a vigência de cada convênio. Para corrigir ou renovar, encerre o
        anterior e registre um novo contrato.
      </p>
      {canWrite && !adding && (
        <Button
          intent="primary"
          size="add"
          disabled={disabled}
          onClick={() => {
            setFileId("");
            setAdding(true);
          }}
        >
          <Plus aria-hidden="true" />
          Adicionar contrato
        </Button>
      )}
      {adding && (
        <DraftForm
          draftKey="partners-contract-panel-1"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const value = (name: string) => String(data.get(name) ?? "");
            if (
              await command({
                action: "contract",
                contract: {
                  reference: value("reference"),
                  terms: value("terms"),
                  startsOn: value("startsOn"),
                  endsOn: value("endsOn"),
                  fileId: fileId || null,
                },
              })
            )
              close();
          }}
        >
          <fieldset disabled={disabled}>
            <legend>Novo contrato</legend>
            <FormField id="contract-reference" label="Referência do contrato">
              <DraftInput name="reference" required minLength={2} maxLength={160} />
            </FormField>
            <FormField id="contract-terms" label="Condições do contrato">
              <DraftTextarea name="terms" required minLength={3} maxLength={5000} />
            </FormField>
            <div className={styles.grid}>
              <FormField id="contract-start" label="Início da vigência">
                <DraftInput
                  type="date"
                  name="startsOn"
                  required
                  onChange={(event) => {
                    const end = event.currentTarget.form?.elements.namedItem("endsOn");
                    if (end instanceof HTMLInputElement) end.min = event.currentTarget.value;
                  }}
                />
              </FormField>
              <FormField id="contract-end" label="Fim da vigência">
                <DraftInput type="date" name="endsOn" required />
              </FormField>
            </div>
            {canReadFiles ? (
              <ContractFiles
                partnerId={partner.id}
                disabled={disabled}
                canUpload={canUpload}
                value={fileId}
                onSelect={setFileId}
              />
            ) : (
              <p>O acesso a arquivos é necessário para anexar um documento.</p>
            )}
            <div className={styles.actions}>
              <Button type="submit" intent="primary">
                Registrar contrato
              </Button>
              <Button type="button" onClick={close}>
                Cancelar
              </Button>
            </div>
          </fieldset>
        </DraftForm>
      )}
      {!partner.contracts.length && !adding && <p>Nenhum contrato registrado.</p>}
      <ul className={styles.list}>
        {partner.contracts.map((contract) => (
          <li key={contract.id} className={styles.card}>
            <h3>{contract.reference}</h3>
            <p>
              {statusLabels[contract.status]} · {formatDate(contract.startsOn)} a{" "}
              {formatDate(contract.endsOn)}
            </p>
            <p className={styles.prose}>{contract.terms}</p>
            <div className={styles.actions}>
              {contract.fileId && canReadFiles && (
                <a
                  className={buttonVariants({ size: "compact" })}
                  href={`/api/v1/partners/${partner.id}/files/${contract.fileId}`}
                >
                  Baixar documento
                </a>
              )}
              {canPublish && contract.status !== "ended" && (
                <>
                  {contract.status === "draft" && (
                    <Button
                      disabled={disabled || !!decision}
                      onClick={() => setDecision({ id: contract.id, status: "approved" })}
                    >
                      Aprovar contrato
                    </Button>
                  )}
                  <Button
                    intent="danger"
                    disabled={disabled || !!decision}
                    onClick={() => setDecision({ id: contract.id, status: "ended" })}
                  >
                    Encerrar contrato
                  </Button>
                </>
              )}
            </div>
            {decision?.id === contract.id && (
              <DraftForm
                draftKey="partners-contract-panel-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (
                    await command({
                      action: "contract-status",
                      contractId: contract.id,
                      status: decision.status,
                    })
                  )
                    setDecision(null);
                }}
              >
                <fieldset disabled={disabled}>
                  <legend>
                    {decision.status === "approved"
                      ? "Confirmar aprovação"
                      : "Confirmar encerramento"}
                  </legend>
                  <p>
                    {decision.status === "approved"
                      ? "Confirme que as condições foram aprovadas antes de disponibilizar benefícios."
                      : "O encerramento retira imediatamente os benefícios vinculados de exibição."}
                  </p>

                  <div className={styles.actions}>
                    <Button
                      type="submit"
                      intent={decision.status === "approved" ? "primary" : "danger"}
                    >
                      Confirmar {decision.status === "approved" ? "aprovação" : "encerramento"}
                    </Button>
                    <Button type="button" onClick={() => setDecision(null)}>
                      Cancelar
                    </Button>
                  </div>
                </fieldset>
              </DraftForm>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
