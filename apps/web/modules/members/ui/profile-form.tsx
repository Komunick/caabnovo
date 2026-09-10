"use client";
import { memberProfileSchema, type MemberProfile } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import styles from "./members.module.css";

export function ProfileForm({
  profile,
  disabled,
  onSave,
}: {
  profile?: MemberProfile;
  disabled: boolean;
  onSave: (profile: unknown, justification: string) => Promise<void>;
}) {
  const initial = profile ?? memberProfileSchema.parse({ name: "Novo cadastro" });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const str = (key: string) => String(data.get(key) ?? "");
        void onSave(
          {
            name: str("name"),
            socialName: str("socialName"),
            cpf: str("cpf"),
            birthDate: str("birthDate") || null,
            email: str("email"),
            phone: str("phone"),
            oab: str("oabNumber")
              ? { number: str("oabNumber"), state: str("oabState"), type: str("oabType") }
              : null,
          },
          str("justification"),
        );
      }}
    >
      <fieldset disabled={disabled}>
        <legend>Identificação e contato</legend>
        <div className={styles.grid}>
          <FormField id="member-name" label="Nome completo">
            <input
              name="name"
              required
              minLength={2}
              maxLength={160}
              defaultValue={profile ? initial.name : ""}
            />
          </FormField>
          <FormField id="member-social" label="Nome social (opcional)">
            <input name="socialName" maxLength={160} defaultValue={initial.socialName} />
          </FormField>
          <FormField id="member-cpf" label="CPF (opcional)">
            <input name="cpf" inputMode="numeric" maxLength={14} defaultValue={initial.cpf} />
          </FormField>
          <FormField id="member-birth" label="Nascimento (opcional)">
            <input
              name="birthDate"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              defaultValue={initial.birthDate ?? ""}
            />
          </FormField>
          <FormField id="member-email" label="E-mail de contato (opcional)">
            <input name="email" type="email" maxLength={254} defaultValue={initial.email} />
          </FormField>
          <FormField id="member-phone" label="Telefone (opcional)">
            <input name="phone" type="tel" maxLength={30} defaultValue={initial.phone} />
          </FormField>
          <FormField id="member-oab-number" label="Número OAB (opcional)">
            <input name="oabNumber" maxLength={20} defaultValue={initial.oab?.number ?? ""} />
          </FormField>
          <FormField id="member-oab-state" label="Seccional OAB">
            <select name="oabState" defaultValue={initial.oab?.state ?? "BA"}>
              {memberProfileSchema.shape.oab
                .unwrap()
                .unwrap()
                .shape.state.options.map((uf) => (
                  <option key={uf}>{uf}</option>
                ))}
            </select>
          </FormField>
          <FormField id="member-oab-type" label="Tipo de inscrição">
            <select name="oabType" defaultValue={initial.oab?.type ?? "lawyer"}>
              <option value="lawyer">Advogado(a)</option>
              <option value="trainee">Estagiário(a)</option>
              <option value="supplementary">Suplementar</option>
            </select>
          </FormField>
        </div>
        <FormField id="member-reason" label="Motivo do cadastro ou alteração">
          <textarea name="justification" required minLength={3} maxLength={1000} />
        </FormField>
        <Button type="submit" intent="primary">
          {profile ? "Salvar cadastro" : "Criar cadastro"}
        </Button>
      </fieldset>
    </form>
  );
}
