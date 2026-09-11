"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { partnerProfileSchema, type PartnerProfile } from "@caab/contracts";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import styles from "./partners.module.css";
export function ProfileForm({
  profile,
  disabled,
  onSave,
}: {
  profile?: PartnerProfile;
  disabled: boolean;
  onSave: (profile: PartnerProfile, justification: string) => Promise<void>;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fields = [
    { name: "name", label: "Nome do parceiro", required: true, max: 160 },
    { name: "category", label: "Categoria", required: true, max: 80 },
    { name: "legalName", label: "Razão social (opcional)", max: 160 },
    { name: "cnpj", label: "CNPJ (opcional)", max: 18 },
    { name: "contactName", label: "Pessoa de contato (opcional)", max: 160 },
    { name: "email", label: "E-mail administrativo (opcional)", type: "email", max: 254 },
    { name: "phone", label: "Telefone administrativo (opcional)", type: "tel", max: 30 },
    { name: "website", label: "Site do parceiro (opcional)", type: "url", max: 500 },
  ];
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const raw = Object.fromEntries([
          ...fields.map((f) => [f.name, String(data.get(f.name) ?? "")]),
          ["description", String(data.get("description") ?? "")],
        ]);
        const parsed = partnerProfileSchema.safeParse(raw);
        if (!parsed.success) {
          setErrors(
            Object.fromEntries(
              parsed.error.issues.map((issue) => [
                String(issue.path[0]),
                issue.path[0] === "cnpj"
                  ? "Informe um CNPJ válido, numérico ou alfanumérico."
                  : "Confira o formato e o preenchimento deste campo.",
              ]),
            ),
          );
          return;
        }
        setErrors({});
        void onSave(parsed.data, String(data.get("justification")));
      }}
    >
      <fieldset disabled={disabled}>
        <legend>Identificação e contato</legend>
        <div className={styles.grid}>
          {fields.map((field) => (
            <FormField
              key={field.name}
              id={`partner-${field.name}`}
              label={field.label}
              error={errors[field.name]}
            >
              <input
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                minLength={field.required ? 2 : undefined}
                maxLength={field.max}
                defaultValue={profile?.[field.name as keyof PartnerProfile] ?? ""}
              />
            </FormField>
          ))}
        </div>
        <FormField id="partner-description" label="Descrição (opcional)">
          <textarea name="description" maxLength={3000} defaultValue={profile?.description ?? ""} />
        </FormField>
        <FormField id="partner-reason" label="Motivo do cadastro ou alteração">
          <textarea name="justification" required minLength={3} maxLength={1000} />
        </FormField>
        <Button type="submit" intent="primary" size={profile ? "default" : "add"}>
          {!profile && <Plus aria-hidden="true" />}
          {profile ? "Salvar cadastro" : "Criar parceiro"}
        </Button>
      </fieldset>
    </form>
  );
}
