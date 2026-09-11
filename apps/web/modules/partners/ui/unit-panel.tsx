"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { PartnerRecord, PartnerUnit } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import type { PartnerCommandHandler } from "./client";
import styles from "./partners.module.css";
export function UnitPanel({
  partner,
  disabled,
  canWrite,
  command,
}: {
  partner: PartnerRecord;
  disabled: boolean;
  canWrite: boolean;
  command: PartnerCommandHandler;
}) {
  const [editing, setEditing] = useState<PartnerUnit | "new" | null>(null);
  const unit = editing && editing !== "new" ? editing : null;
  return (
    <section className="panel">
      <h2>Unidades</h2>
      <p>Locais de atendimento e regiões atendidas pelo parceiro.</p>
      {canWrite && !editing && (
        <Button size="add" intent="primary" disabled={disabled} onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" />
          Adicionar unidade
        </Button>
      )}
      {editing && (
        <form
          key={unit?.id ?? "new"}
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const value = (name: string) => String(data.get(name) ?? "");
            const profile = Object.fromEntries(
              ["name", "mode", "city", "state", "address", "region", "phone"].map((name) => [
                name,
                value(name),
              ]),
            );
            if (
              await command({
                action: "unit",
                ...(unit ? { unitId: unit.id } : {}),
                profile,
                active: data.get("active") === "on",
                justification: value("justification"),
              })
            )
              setEditing(null);
          }}
        >
          <fieldset disabled={disabled}>
            <legend>{unit ? "Editar unidade" : "Nova unidade"}</legend>
            <div className={styles.grid}>
              <FormField id="unit-name" label="Nome da unidade">
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={160}
                  defaultValue={unit?.profile.name}
                />
              </FormField>
              <FormField id="unit-mode" label="Atendimento">
                <select name="mode" defaultValue={unit?.profile.mode ?? "presential"}>
                  <option value="presential">Presencial</option>
                  <option value="remote">Remoto</option>
                </select>
              </FormField>
              {[
                ["city", "Cidade", 100],
                ["state", "Estado (UF)", 2],
                ["address", "Endereço", 300],
                ["region", "Região atendida", 300],
                ["phone", "Telefone da unidade", 30],
              ].map(([name, label, max]) => (
                <FormField key={name} id={`unit-${name}`} label={`${label} (opcional)`}>
                  <input
                    name={String(name)}
                    maxLength={Number(max)}
                    defaultValue={unit?.profile[name as keyof PartnerUnit["profile"]]}
                    pattern={name === "state" ? "[A-Z]{2}" : undefined}
                  />
                </FormField>
              ))}
            </div>
            <div className={styles.checks}>
              <label>
                <input type="checkbox" name="active" defaultChecked={unit?.active ?? true} />
                Unidade ativa
              </label>
            </div>
            <FormField id="unit-reason" label="Motivo do cadastro ou alteração">
              <textarea name="justification" required minLength={3} maxLength={1000} />
            </FormField>
            <div className={styles.actions}>
              <Button type="submit" intent="primary">
                Salvar unidade
              </Button>
              <Button type="button" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </fieldset>
        </form>
      )}
      {!partner.units.length && !editing && <p>Nenhuma unidade cadastrada.</p>}
      <ul className={styles.list}>
        {partner.units.map((item) => (
          <li key={item.id} className={styles.card}>
            <h3>{item.profile.name}</h3>
            <p>
              {item.active ? "Ativa" : "Inativa"} ·{" "}
              {item.profile.mode === "remote" ? "Atendimento remoto" : "Atendimento presencial"}
            </p>
            <p>
              {[item.profile.address, item.profile.city, item.profile.state]
                .filter(Boolean)
                .join(" · ") || "Localidade não informada"}
            </p>
            {item.profile.region && <p>Região atendida: {item.profile.region}</p>}
            {item.profile.phone && <p>Telefone: {item.profile.phone}</p>}
            {canWrite && (
              <Button
                disabled={disabled || !!editing}
                onClick={() => setEditing(item)}
                aria-label={`Editar unidade ${item.profile.name}`}
              >
                Editar unidade
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
