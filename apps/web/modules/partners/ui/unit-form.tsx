"use client";
import { useDraftState } from "@/components/workspace-drafts";
import { DraftInput, DraftSelect, DraftForm } from "@/components/ui/draft-controls";
import { partnerUnitSchema, contactFieldMessages, type PartnerUnit } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ValidatedTextField } from "@/components/ui/validated-text-field";
import { BrazilianAddressFields } from "@/components/ui/brazilian-address-fields";
import type { PartnerCommandHandler } from "./client";
import styles from "./partners.module.css";
export function UnitForm({
  unit,
  disabled,
  command,
  onClose,
}: {
  unit: PartnerUnit | null;
  disabled: boolean;
  command: PartnerCommandHandler;
  onClose: () => void;
}) {
  const [error, setError] = useDraftState(`partners-unit-form:${unit?.id ?? "new"}:error`, "");
  return (
    <DraftForm
      draftKey={`partners-unit-form:${unit?.id ?? "new"}`}
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const raw = Object.fromEntries(
          [
            "name",
            "mode",
            "postalCode",
            "street",
            "neighborhood",
            "number",
            "complement",
            "address",
            "city",
            "state",
            "region",
            "phone",
          ].map((name) => [name, String(data.get(name) ?? "")]),
        );
        const parsed = partnerUnitSchema.safeParse(raw);
        if (!parsed.success) {
          setError("Confira os campos indicados antes de salvar.");
          return;
        }
        setError("");
        if (
          await command({
            action: "unit",
            ...(unit ? { unitId: unit.id } : {}),
            profile: parsed.data,
            active: data.get("active") === "on",
          })
        )
          onClose();
      }}
    >
      <fieldset disabled={disabled}>
        <legend>{unit ? "Editar unidade" : "Nova unidade"}</legend>
        {error && <p role="alert">{error}</p>}
        <div className={styles.grid}>
          <ValidatedTextField
            id="unit-name"
            label="Nome da unidade"
            name="name"
            required
            minLength={2}
            maxLength={160}
            defaultValue={unit?.profile.name}
            schema={partnerUnitSchema.shape.name}
            message="Informe o nome da unidade com pelo menos dois caracteres."
          />
          <FormField id="unit-mode" label="Atendimento">
            <DraftSelect name="mode" defaultValue={unit?.profile.mode ?? "presential"}>
              <option value="presential">Presencial</option>
              <option value="remote">Remoto</option>
            </DraftSelect>
          </FormField>
        </div>
        <BrazilianAddressFields prefix="unit" initial={unit?.profile} className={styles.grid} />
        <div className={styles.grid}>
          <FormField id="unit-region" label="Região atendida (opcional)">
            <DraftInput name="region" maxLength={300} defaultValue={unit?.profile.region} />
          </FormField>
          <ValidatedTextField
            id="unit-phone"
            label="Telefone da unidade (opcional)"
            name="phone"
            mask="phone"
            autoComplete="tel-national"
            placeholder="(71) 3333-4444"
            hint="DDD + oito dígitos (fixo) ou nove dígitos (celular)."
            defaultValue={unit?.profile.phone}
            schema={partnerUnitSchema.shape.phone}
            message={contactFieldMessages.phone}
          />
        </div>
        <div className={styles.checks}>
          <label>
            <DraftInput type="checkbox" name="active" defaultChecked={unit?.active ?? true} />
            Unidade ativa
          </label>
        </div>

        <div className={styles.actions}>
          <Button type="submit" intent="primary">
            Salvar unidade
          </Button>
          <Button type="button" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </fieldset>
    </DraftForm>
  );
}
