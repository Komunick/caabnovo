"use client";
import { useDraftCache } from "@/components/workspace-drafts";
import { DraftInput, DraftSelect, DraftForm } from "@/components/ui/draft-controls";
import { Plus } from "lucide-react";
import {
  memberProfileSchema,
  memberGenderLabels,
  oabNumberSchema,
  contactFieldMessages,
  type MemberProfile,
} from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { BirthDateField } from "./birth-date-field";
import { ValidatedTextField } from "@/components/ui/validated-text-field";
import styles from "./members.module.css";

export function ProfileForm({
  profile,
  disabled,
  onSave,
}: {
  profile?: MemberProfile;
  disabled: boolean;
  onSave: (profile: unknown) => Promise<boolean | void>;
}) {
  const initial = profile ?? memberProfileSchema.parse({ name: "Novo cadastro" });
  const drafts = useDraftCache();
  return (
    <DraftForm
      draftKey="members-profile-form-1"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const str = (key: string) => String(data.get(key) ?? "");
        const saved = await onSave({
          name: str("name"),
          socialName: str("socialName"),
          category: str("category"),
          gender: str("gender"),
          city: str("city"),
          residenceState: str("residenceState"),
          cpf: str("cpf"),
          birthDate: str("birthDate") || null,
          email: str("email"),
          phone: str("phone"),
          oab: str("oabNumber")
            ? { number: str("oabNumber"), state: str("oabState"), type: str("oabType") }
            : null,
        });
        if (saved) drafts.clear("members-profile-form-1:");
      }}
    >
      <fieldset disabled={disabled}>
        <legend>Identificação e contato</legend>
        <div className={styles.grid}>
          <FormField id="member-name" label="Nome completo">
            <DraftInput
              name="name"
              required
              minLength={2}
              maxLength={160}
              defaultValue={profile ? initial.name : ""}
            />
          </FormField>
          <FormField id="member-social" label="Nome social (opcional)">
            <DraftInput name="socialName" maxLength={160} defaultValue={initial.socialName} />
          </FormField>
          <FormField id="member-category" label="Categoria (opcional)">
            <DraftInput name="category" maxLength={80} defaultValue={initial.category} />
          </FormField>
          <FormField id="member-gender" label="Gênero (opcional)">
            <DraftSelect name="gender" defaultValue={initial.gender}>
              <option value="">Não informado</option>
              {Object.entries(memberGenderLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </DraftSelect>
          </FormField>
          <FormField id="member-city" label="Cidade de residência (opcional)">
            <DraftInput name="city" maxLength={120} defaultValue={initial.city} />
          </FormField>
          <FormField id="member-residence-state" label="Estado de residência (opcional)">
            <DraftSelect name="residenceState" defaultValue={initial.residenceState}>
              <option value="">Não informado</option>
              {memberProfileSchema.shape.oab
                .unwrap()
                .unwrap()
                .shape.state.options.map((uf) => (
                  <option key={uf}>{uf}</option>
                ))}
            </DraftSelect>
          </FormField>
          <ValidatedTextField
            id="member-cpf"
            label="CPF (opcional)"
            schema={memberProfileSchema.shape.cpf}
            message="Informe um CPF válido com 11 dígitos."
            name="cpf"
            mask="cpf"
            placeholder="000.000.000-00"
            defaultValue={initial.cpf}
          />
          <FormField id="member-birth" label="Nascimento (opcional)">
            <BirthDateField disabled={disabled} defaultValue={initial.birthDate ?? ""} />
          </FormField>
          <ValidatedTextField
            id="member-email"
            label="E-mail de contato (opcional)"
            schema={memberProfileSchema.shape.email}
            message={contactFieldMessages.email}
            name="email"
            type="email"
            maxLength={254}
            defaultValue={initial.email}
          />
          <ValidatedTextField
            id="member-phone"
            label="Telefone (opcional)"
            schema={memberProfileSchema.shape.phone}
            message={contactFieldMessages.phone}
            name="phone"
            mask="phone"
            autoComplete="tel-national"
            placeholder="(00) 00000-0000"
            defaultValue={initial.phone}
          />
          <ValidatedTextField
            id="member-oab-number"
            label="Número OAB (opcional)"
            name="oabNumber"
            mask="oab"
            maxLength={6}
            defaultValue={initial.oab?.number ?? ""}
            schema={{
              safeParse: (value) => ({
                success: value === "" || oabNumberSchema.safeParse(value).success,
              }),
            }}
            message="Informe uma inscrição válida com até seis números."
          />
          <FormField id="member-oab-state" label="Estado da OAB">
            <DraftSelect name="oabState" defaultValue={initial.oab?.state ?? "BA"}>
              {memberProfileSchema.shape.oab
                .unwrap()
                .unwrap()
                .shape.state.options.map((uf) => (
                  <option key={uf}>{uf}</option>
                ))}
            </DraftSelect>
          </FormField>
          <FormField id="member-oab-type" label="Tipo de inscrição">
            <DraftSelect name="oabType" defaultValue={initial.oab?.type ?? "lawyer"}>
              <option value="lawyer">Advogado(a)</option>
              <option value="trainee">Estagiário(a)</option>
              <option value="supplementary">Suplementar</option>
            </DraftSelect>
          </FormField>
        </div>

        <Button type="submit" intent="primary" size={profile ? "default" : "add"}>
          {!profile && <Plus size={20} aria-hidden="true" />}
          {profile ? "Salvar cadastro" : "Criar cadastro"}
        </Button>
      </fieldset>
    </DraftForm>
  );
}
