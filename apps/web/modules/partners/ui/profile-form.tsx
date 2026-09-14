"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { partnerProfileSchema, contactFieldMessages, type PartnerProfile } from "@caab/contracts";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { ValidatedTextField } from "@/components/ui/validated-text-field";
import { BrazilianAddressFields } from "@/components/ui/brazilian-address-fields";
import styles from "./partners.module.css";
import { partnerRequest } from "./client";
import type { PartnerCategory } from "@caab/contracts";
export function ProfileForm({
  profile,
  disabled,
  onSave,
}: {
  profile?: PartnerProfile;
  disabled: boolean;
  onSave: (profile: PartnerProfile) => Promise<void>;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    void partnerRequest<{ items: PartnerCategory[] }>("/api/v1/partners/categories", {
      signal: controller.signal,
    })
      .then((result) => setCategories(result.items))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const fields = [
    { name: "name", label: "Nome do parceiro", required: true, max: 160 },
    { name: "category", label: "Categoria", required: true, max: 80 },
    { name: "legalName", label: "Razão social (opcional)", max: 160 },
    { name: "cnpj", label: "CNPJ (opcional)", max: 18 },
    { name: "contactName", label: "Pessoa de contato (opcional)", max: 160 },
    { name: "email", label: "E-mail administrativo (opcional)", type: "email", max: 254 },
    { name: "phone", label: "Telefone administrativo (opcional)", type: "tel", max: 15 },
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
          ...[
            "postalCode",
            "street",
            "neighborhood",
            "number",
            "complement",
            "address",
            "city",
            "state",
          ].map((name) => [name, String(data.get(name) ?? "")]),
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
        void onSave(parsed.data);
      }}
    >
      <fieldset disabled={disabled}>
        <legend>Identificação e contato</legend>
        <div className={styles.grid}>
          {fields.map((field) => (
            <ValidatedTextField
              key={field.name}
              id={`partner-${field.name}`}
              label={field.label}
              schema={
                partnerProfileSchema.shape[field.name as keyof typeof partnerProfileSchema.shape]
              }
              message={
                contactFieldMessages[field.name as keyof typeof contactFieldMessages] ??
                "Confira o formato e o preenchimento deste campo."
              }
              mask={field.name === "cnpj" ? "cnpj" : field.name === "phone" ? "phone" : undefined}
              name={field.name}
              list={field.name === "category" ? "partner-category-options" : undefined}
              type={field.type ?? "text"}
              required={field.required}
              minLength={field.required ? 2 : undefined}
              maxLength={field.max}
              defaultValue={profile?.[field.name as keyof PartnerProfile] ?? ""}
            />
          ))}
        </div>
        {Object.keys(errors).length > 0 && (
          <p role="alert">Confira os campos indicados antes de salvar.</p>
        )}
        <BrazilianAddressFields prefix="partner" initial={profile} className={styles.grid} />
        <datalist id="partner-category-options">
          {categories
            .filter((category) => category.active)
            .map((category) => (
              <option key={category.id} value={category.name} />
            ))}
        </datalist>
        <FormField id="partner-description" label="Descrição (opcional)">
          <textarea name="description" maxLength={3000} defaultValue={profile?.description ?? ""} />
        </FormField>

        <Button type="submit" intent="primary" size={profile ? "default" : "add"}>
          {!profile && <Plus aria-hidden="true" />}
          {profile ? "Salvar cadastro" : "Criar parceiro"}
        </Button>
      </fieldset>
    </form>
  );
}
