"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import {
  benefitDraftSchema,
  type BenefitDraft,
  type PartnerBenefit,
  type PartnerRecord,
} from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import type { PartnerCommandHandler } from "./client";
import { formatDate } from "./labels";
import styles from "./partners.module.css";
function BenefitPreview({
  draft,
  partner,
  published = false,
}: {
  draft: BenefitDraft;
  partner: PartnerRecord;
  published?: boolean;
}) {
  const unit = partner.units.find((unit) => unit.id === draft.unitId);
  return (
    <article
      className={`${styles.card} ${styles.preview}`}
      aria-label={published ? "Prévia da versão publicada" : "Prévia do benefício"}
    >
      <p className="eyebrow">
        {published ? "Versão publicada" : "Prévia do rascunho"} · {partner.profile.name}
      </p>
      <h3>{draft.title || "Título do benefício"}</h3>
      <p className={styles.prose}>{draft.description || "A descrição aparecerá aqui."}</p>
      <p>
        <strong>Condições de uso</strong>
      </p>
      <p className={styles.prose}>{draft.conditions || "Informe as condições de uso."}</p>
      <p>
        <strong>Público:</strong> {draft.audience || "Não informado"}
      </p>
      <p>
        <strong>Atendimento:</strong>{" "}
        {unit
          ? [unit.profile.name, unit.profile.city, unit.profile.state].filter(Boolean).join(" · ")
          : "Selecione uma unidade"}
      </p>
      <p>
        <strong>Vigência:</strong> {formatDate(draft.startsOn)} a {formatDate(draft.endsOn)}
      </p>
    </article>
  );
}
function BenefitForm({
  partner,
  benefit,
  disabled,
  command,
  onClose,
}: {
  partner: PartnerRecord;
  benefit: PartnerBenefit | null;
  disabled: boolean;
  command: PartnerCommandHandler;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(benefit?.draft ?? benefitDraftSchema.parse({}));
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const parsed = benefitDraftSchema.safeParse(draft);
        if (!parsed.success) {
          setError("Confira as datas: o fim não pode ser anterior ao início.");
          return;
        }
        if (
          await command({
            action: "benefit",
            ...(benefit ? { benefitId: benefit.id } : {}),
            draft: parsed.data,
            justification: String(new FormData(event.currentTarget).get("justification")),
          })
        )
          onClose();
      }}
    >
      <fieldset disabled={disabled}>
        <legend>{benefit ? "Editar rascunho" : "Novo benefício"}</legend>
        <p>
          Você pode salvar um rascunho incompleto. A publicação exige todos os campos e um contrato
          aprovado.
        </p>
        {error && <p role="alert">{error}</p>}
        <FormField id="benefit-title" label="Título">
          <input
            maxLength={160}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </FormField>
        {(
          [
            ["description", "Descrição", 3000],
            ["conditions", "Condições de uso", 5000],
            ["audience", "Público do benefício", 1000],
          ] as const
        ).map(([key, label, max]) => (
          <FormField key={key} id={`benefit-${key}`} label={label}>
            <textarea
              maxLength={max}
              value={draft[key]}
              onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
            />
          </FormField>
        ))}
        <div className={styles.grid}>
          <FormField id="benefit-unit" label="Unidade">
            <select
              value={draft.unitId ?? ""}
              onChange={(event) => setDraft({ ...draft, unitId: event.target.value || null })}
            >
              <option value="">Selecionar unidade</option>
              {partner.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.profile.name}
                  {unit.active ? "" : " (inativa)"}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="benefit-contract" label="Contrato">
            <select
              value={draft.contractId ?? ""}
              onChange={(event) => setDraft({ ...draft, contractId: event.target.value || null })}
            >
              <option value="">Selecionar contrato</option>
              {partner.contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.reference} ·{" "}
                  {contract.status === "approved"
                    ? "aprovado"
                    : contract.status === "ended"
                      ? "encerrado"
                      : "aguardando aprovação"}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="benefit-start" label="Início da oferta">
            <input
              type="date"
              value={draft.startsOn ?? ""}
              onChange={(event) => setDraft({ ...draft, startsOn: event.target.value || null })}
            />
          </FormField>
          <FormField id="benefit-end" label="Fim da oferta">
            <input
              type="date"
              min={draft.startsOn ?? undefined}
              value={draft.endsOn ?? ""}
              onChange={(event) => setDraft({ ...draft, endsOn: event.target.value || null })}
            />
          </FormField>
        </div>
        <fieldset className={styles.checks}>
          <legend>Canais de exibição</legend>
          {(["site", "app"] as const).map((channel) => (
            <label key={channel}>
              <input
                type="checkbox"
                checked={draft.channels.includes(channel)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    channels: event.target.checked
                      ? [...draft.channels, channel]
                      : draft.channels.filter((value) => value !== channel),
                  })
                }
              />
              {channel === "site" ? "Site" : "Aplicativo"}
            </label>
          ))}
        </fieldset>
        <BenefitPreview draft={draft} partner={partner} />
        <FormField id="benefit-reason" label="Motivo do cadastro ou alteração">
          <textarea name="justification" required minLength={3} maxLength={1000} />
        </FormField>
        <div className={styles.actions}>
          <Button type="submit" intent="primary">
            Salvar rascunho
          </Button>
          <Button type="button" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
export function BenefitPanel({
  partner,
  disabled,
  canWrite,
  canPublish,
  command,
}: {
  partner: PartnerRecord;
  disabled: boolean;
  canWrite: boolean;
  canPublish: boolean;
  command: PartnerCommandHandler;
}) {
  const [editing, setEditing] = useState<PartnerBenefit | "new" | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [publishedPreview, setPublishedPreview] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ id: string; action: "publish" | "hide" } | null>(null);
  return (
    <section className="panel">
      <h2>Benefícios</h2>
      <p>
        Prepare a oferta, confira a prévia e publique nos canais escolhidos. Alterações no rascunho
        só aparecem após uma nova publicação.
      </p>
      {canWrite && !editing && (
        <Button size="add" intent="primary" disabled={disabled} onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" />
          Adicionar benefício
        </Button>
      )}
      {editing && (
        <BenefitForm
          key={editing === "new" ? "new" : editing.id}
          partner={partner}
          benefit={editing === "new" ? null : editing}
          disabled={disabled}
          command={command}
          onClose={() => setEditing(null)}
        />
      )}
      {!partner.benefits.length && !editing && <p>Nenhum benefício cadastrado.</p>}
      <ul className={styles.list}>
        {partner.benefits.map((benefit) => (
          <li className={styles.card} key={benefit.id}>
            <h3>{benefit.draft.title || "Rascunho sem título"}</h3>
            <p>
              {benefit.visible
                ? "Em exibição"
                : benefit.published
                  ? "Publicado, sem exibição no momento"
                  : "Rascunho"}{" "}
              · {benefit.published ? "Vigência publicada" : "Vigência do rascunho"}:{" "}
              {formatDate((benefit.published ?? benefit.draft).startsOn)} a{" "}
              {formatDate((benefit.published ?? benefit.draft).endsOn)}
            </p>
            {benefit.published && (
              <p>
                Canais publicados:{" "}
                {benefit.published.channels
                  .map((channel) => (channel === "site" ? "Site" : "Aplicativo"))
                  .join(", ")}
              </p>
            )}
            {benefit.published && !benefit.visible && (
              <p>Confira a situação do parceiro, da unidade, do contrato e as datas de vigência.</p>
            )}
            <div className={styles.actions}>
              <Button
                onClick={() => setPreview(preview === benefit.id ? null : benefit.id)}
                aria-expanded={preview === benefit.id}
              >
                Prévia do rascunho
              </Button>
              {benefit.published && (
                <Button
                  onClick={() =>
                    setPublishedPreview(publishedPreview === benefit.id ? null : benefit.id)
                  }
                  aria-expanded={publishedPreview === benefit.id}
                >
                  Conferir versão publicada
                </Button>
              )}
              {canWrite && (
                <Button
                  disabled={disabled || !!editing || !!decision}
                  onClick={() => setEditing(benefit)}
                >
                  Editar benefício
                </Button>
              )}
              {canPublish && (
                <>
                  <Button
                    intent="primary"
                    disabled={disabled || !!editing || !!decision}
                    onClick={() => setDecision({ id: benefit.id, action: "publish" })}
                  >
                    {benefit.published ? "Republicar" : "Publicar"}
                  </Button>
                  {benefit.published && (
                    <Button
                      disabled={disabled || !!editing || !!decision}
                      onClick={() => setDecision({ id: benefit.id, action: "hide" })}
                    >
                      Retirar de exibição
                    </Button>
                  )}
                </>
              )}
            </div>
            {preview === benefit.id && <BenefitPreview draft={benefit.draft} partner={partner} />}
            {publishedPreview === benefit.id && benefit.published && (
              <BenefitPreview draft={benefit.published} partner={partner} published />
            )}
            {decision?.id === benefit.id && (
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (
                    await command({
                      action: decision.action,
                      benefitId: benefit.id,
                      justification: String(new FormData(event.currentTarget).get("justification")),
                    })
                  )
                    setDecision(null);
                }}
              >
                <fieldset disabled={disabled}>
                  <legend>
                    {decision.action === "publish"
                      ? "Confirmar publicação"
                      : "Retirar benefício de exibição"}
                  </legend>
                  {decision.action === "publish" && (
                    <>
                      <p>
                        Canais:{" "}
                        {benefit.draft.channels
                          .map((channel) => (channel === "site" ? "Site" : "Aplicativo"))
                          .join(", ") || "Nenhum selecionado"}
                      </p>
                      <BenefitPreview draft={benefit.draft} partner={partner} />
                    </>
                  )}
                  <FormField id="benefit-publish-reason" label="Justificativa da decisão">
                    <textarea name="justification" required minLength={3} maxLength={1000} />
                  </FormField>
                  <div className={styles.actions}>
                    <Button type="submit" intent="primary">
                      {decision.action === "publish"
                        ? "Confirmar publicação"
                        : "Confirmar retirada"}
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
