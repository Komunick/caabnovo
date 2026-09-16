"use client";
import type { MessageAudience } from "@caab/contracts";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { MessageChoice } from "./choice";
import styles from "./messages.module.css";
const states =
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
export function AudienceFields({
  value,
  onChange,
  names,
  setNames,
}: {
  value: MessageAudience;
  onChange(v: MessageAudience): void;
  names: Record<string, string>;
  setNames(v: Record<string, string>): void;
}) {
  const set = (patch: Partial<MessageAudience>) => onChange({ ...value, ...patch });
  return (
    <div className={styles.stack}>
      <div className={styles.grid}>
        <div>
          <FormField
            id="audience-state"
            label="Estado da OAB"
            hint="Deixe vazio para todos os estados."
          >
            <input
              list="audience-state-options"
              value={value.state}
              maxLength={2}
              pattern={states.join("|")}
              placeholder="Selecione ou digite"
              onChange={(e) =>
                set({ state: e.target.value.toUpperCase() as MessageAudience["state"] })
              }
            />
          </FormField>
          <datalist id="audience-state-options">
            {states.map((state) => (
              <option key={state} value={state} />
            ))}
          </datalist>
        </div>
        <FormField id="audience-contact" label="Contato cadastrado">
          <select
            value={value.contact}
            onChange={(e) => set({ contact: e.target.value as MessageAudience["contact"] })}
          >
            <option value="any">Qualquer situação</option>
            <option value="email">Com e-mail</option>
            <option value="phone">Com telefone</option>
          </select>
        </FormField>
      </div>
      <p>
        Sem seleção individual, entram os associados não arquivados que atendem aos filtros.
        Bloqueios de comunicação sempre são respeitados.
      </p>
      {(["memberIds", "excludedIds"] as const).map((field) => (
        <div key={field}>
          <MessageChoice
            label={field === "memberIds" ? "Selecionar destinatário" : "Excluir destinatário"}
            resource="recipients"
            onChoose={(item) => {
              if (!value[field].includes(item.id) && value[field].length < 500) {
                set({ [field]: [...value[field], item.id] });
                setNames({ ...names, [item.id]: item.name ?? "Associado" });
              }
            }}
          />
          <ul className={styles.people}>
            {value[field].map((id, index) => (
              <li key={id}>
                <span>{names[id] ?? `Destinatário ${index + 1}`}</span>
                <Button
                  onClick={() => set({ [field]: value[field].filter((v) => v !== id) })}
                  aria-label={`Remover ${names[id] ?? `destinatário ${index + 1}`} de ${field === "memberIds" ? "selecionados" : "exclusões"}`}
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
          <p>
            {value[field].length} {field === "memberIds" ? "selecionado(s)" : "excluído(s)"} ·
            limite de 500
          </p>
        </div>
      ))}
    </div>
  );
}
