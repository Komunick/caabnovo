"use client";
import { useEffect, useState } from "react";
import { messageAudienceSchema, memberGenderLabels, type MessageAudience } from "@caab/contracts";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { MessageChoice } from "./choice";
import { useMessageData } from "./client";
import { AudienceSummary } from "./audience-summary";
import styles from "./messages.module.css";
const states =
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
function AudienceText({
  field,
  label,
  value,
  onChange,
}: {
  field: "category" | "city";
  label: string;
  value: string;
  onChange(v: string): void;
}) {
  const [search, setSearch] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(value), 200);
    return () => clearTimeout(timer);
  }, [value]);
  const options = useMessageData<{ items: { name: string }[] }>(
    `${field === "category" ? "categories" : "cities"}?q=${encodeURIComponent(search)}&pageSize=50`,
  );
  return (
    <div>
      <FormField
        id={`audience-${field}`}
        label={label}
        hint="Selecione ou digite o valor do cadastro. Vazio inclui todos."
      >
        <input
          list={`audience-${field}-options`}
          value={value}
          maxLength={field === "category" ? 80 : 120}
          placeholder="Selecione ou digite"
          onChange={(e) => onChange(e.target.value)}
        />
      </FormField>
      <datalist id={`audience-${field}-options`}>
        {options.data?.items.map((item) => (
          <option key={item.name} value={item.name} />
        ))}
      </datalist>
      {options.error && (
        <p role="status">Sugestões indisponíveis. Você pode digitar o valor do cadastro.</p>
      )}
    </div>
  );
}
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
  const [pages, setPages] = useState({ memberIds: 0, excludedIds: 0 });
  return (
    <div className={styles.stack}>
      <div className={styles.actions}>
        <Button onClick={() => onChange(messageAudienceSchema.parse({}))}>
          Todos os cadastros
        </Button>
      </div>
      <p>
        Sem filtros ou seleção individual, entram todos os cadastros não arquivados, sem limite de
        destinatários. Os filtros abaixo são combinados: a pessoa precisa atender a todos. Exclusões
        e bloqueios de comunicação sempre prevalecem.
      </p>
      <div className={styles.grid}>
        <AudienceText
          field="category"
          label="Categoria"
          value={value.category}
          onChange={(category) => set({ category })}
        />
        <FormField id="audience-gender" label="Gênero">
          <select
            value={value.gender}
            onChange={(e) => set({ gender: e.target.value as MessageAudience["gender"] })}
          >
            <option value="">Todos</option>
            {Object.entries(memberGenderLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          id="audience-relationship"
          label="Titular ou dependente"
          hint="Dependente tem vínculo vigente com um titular; sem esse vínculo, entra como titular."
        >
          <select
            value={value.relationship}
            onChange={(e) =>
              set({ relationship: e.target.value as MessageAudience["relationship"] })
            }
          >
            <option value="any">Todos</option>
            <option value="holder">Titulares</option>
            <option value="dependent">Dependentes</option>
          </select>
        </FormField>
        <FormField id="audience-status" label="Situação administrativa">
          <select
            value={value.administrativeStatus}
            onChange={(e) =>
              set({
                administrativeStatus: e.target.value as MessageAudience["administrativeStatus"],
              })
            }
          >
            <option value="any">Todas</option>
            <option value="active">Ativa</option>
            <option value="inactive">Inativa</option>
            <option value="blocked">Bloqueada</option>
          </select>
        </FormField>
        <AudienceText
          field="city"
          label="Cidade de residência"
          value={value.city}
          onChange={(city) => set({ city })}
        />
        {(
          [
            ["residenceState", "Estado de residência"],
            ["state", "Estado da OAB"],
          ] as const
        ).map(([field, label]) => (
          <div key={field}>
            <FormField id={`audience-${field}`} label={label} hint="Vazio inclui todos os estados.">
              <input
                list="audience-state-options"
                value={value[field]}
                maxLength={2}
                pattern={states.join("|")}
                placeholder="Selecione ou digite"
                onChange={(e) => set({ [field]: e.target.value.toUpperCase() })}
              />
            </FormField>
          </div>
        ))}
        <datalist id="audience-state-options">
          {states.map((state) => (
            <option key={state} value={state} />
          ))}
        </datalist>
        {(
          [
            ["minAge", "Idade mínima"],
            ["maxAge", "Idade máxima"],
          ] as const
        ).map(([field, label]) => (
          <FormField
            key={field}
            id={`audience-${field}`}
            label={label}
            hint="Anos completos, inclusive. Vazio não restringe."
          >
            <input
              type="number"
              min={0}
              max={150}
              step={1}
              value={value[field] ?? ""}
              onChange={(e) =>
                set({ [field]: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </FormField>
        ))}
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
      {value.minAge !== null && value.maxAge !== null && value.minAge > value.maxAge && (
        <p role="alert">A idade mínima não pode superar a máxima.</p>
      )}
      <AudienceSummary audience={value} />
      <p>
        Filtros específicos não incluem cadastros sem a informação correspondente. A idade e os
        vínculos são conferidos novamente na data programada.
      </p>
      {(["memberIds", "excludedIds"] as const).map((field) => {
        const page = Math.min(pages[field], Math.max(0, Math.ceil(value[field].length / 25) - 1));
        return (
          <div key={field}>
            <MessageChoice
              label={field === "memberIds" ? "Selecionar destinatário" : "Excluir destinatário"}
              resource="recipients"
              onChoose={(item) => {
                if (!value[field].includes(item.id)) {
                  set({ [field]: [...value[field], item.id] });
                  setNames({ ...names, [item.id]: item.name ?? "Associado" });
                  setPages({ ...pages, [field]: Math.floor(value[field].length / 25) });
                }
              }}
            />
            <ul className={styles.people}>
              {value[field].slice(page * 25, (page + 1) * 25).map((id, index) => (
                <li key={id}>
                  <span>{names[id] ?? `Destinatário ${page * 25 + index + 1}`}</span>
                  <Button
                    onClick={() => set({ [field]: value[field].filter((v) => v !== id) })}
                    aria-label={`Remover ${names[id] ?? `destinatário ${page * 25 + index + 1}`} de ${field === "memberIds" ? "selecionados" : "exclusões"}`}
                  >
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
            <p>
              {value[field].length} {field === "memberIds" ? "selecionado(s)" : "excluído(s)"}
            </p>
            {value[field].length > 25 && (
              <div
                className={styles.actions}
                role="group"
                aria-label={field === "memberIds" ? "Seleção individual" : "Exclusões individuais"}
              >
                <Button
                  disabled={page === 0}
                  onClick={() => setPages({ ...pages, [field]: page - 1 })}
                >
                  Anterior
                </Button>
                <span>
                  Página {page + 1} de {Math.ceil(value[field].length / 25)}
                </span>
                <Button
                  disabled={(page + 1) * 25 >= value[field].length}
                  onClick={() => setPages({ ...pages, [field]: page + 1 })}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
