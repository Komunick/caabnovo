"use client";
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
  const [adding, setAdding] = useState(false);
  const [fileId, setFileId] = useState("");
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
        <form
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
                justification: value("justification"),
              })
            )
              setAdding(false);
          }}
        >
          <fieldset disabled={disabled}>
            <legend>Novo contrato</legend>
            <FormField id="contract-reference" label="Referência do contrato">
              <input name="reference" required minLength={2} maxLength={160} />
            </FormField>
            <FormField id="contract-terms" label="Condições do contrato">
              <textarea name="terms" required minLength={3} maxLength={5000} />
            </FormField>
            <div className={styles.grid}>
              <FormField id="contract-start" label="Início da vigência">
                <input type="date" name="startsOn" required />
              </FormField>
              <FormField id="contract-end" label="Fim da vigência">
                <input type="date" name="endsOn" required />
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
            <FormField id="contract-reason" label="Motivo do registro">
              <textarea name="justification" required minLength={3} maxLength={1000} />
            </FormField>
            <div className={styles.actions}>
              <Button type="submit" intent="primary">
                Registrar contrato
              </Button>
              <Button type="button" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </div>
          </fieldset>
        </form>
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
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (
                    await command({
                      action: "contract-status",
                      contractId: contract.id,
                      status: decision.status,
                      justification: String(new FormData(event.currentTarget).get("justification")),
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
                  <FormField id="contract-decision-reason" label="Justificativa da decisão">
                    <textarea name="justification" required minLength={3} maxLength={1000} />
                  </FormField>
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
              </form>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
