"use client";
import { useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { Plus } from "lucide-react";
import type { PartnerRecord, PartnerUnit } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { UnitForm } from "./unit-form";
import { formatContactInput } from "@/components/ui/masked-contact-input";
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
  const [editing, setEditing] = useDraftState<PartnerUnit | "new" | null>(
    "unit-panel:editing",
    null,
  );
  const drafts = useDraftCache();
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
        <UnitForm
          key={unit?.id ?? "new"}
          unit={unit}
          disabled={disabled}
          command={command}
          onClose={() => {
            drafts.clear(`partners-unit-form:${unit?.id ?? "new"}:`);
            setEditing(null);
          }}
        />
      )}
      {!partner.units.length && !editing && <p>Nenhuma unidade cadastrada.</p>}
      <ul className={styles.list}>
        {partner.units.map((item) => (
          <li key={item.id} id={`unit-${item.id}`} className={styles.card}>
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
            {item.profile.phone && (
              <p>Telefone: {formatContactInput(item.profile.phone, "phone")}</p>
            )}
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
