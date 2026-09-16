"use client";
import { useDraftState } from "@/components/workspace-drafts";
import { DraftInput, DraftForm } from "@/components/ui/draft-controls";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { accessPrerequisites, type AccessPermission } from "@caab/contracts";
import { Button } from "@/components/ui/button";

import { accessGroups as groups } from "../access-labels";

const errors: Record<string, string> = {
  ACCESS_VERSION_CONFLICT:
    "Os acessos mudaram enquanto você editava. Recarregue a página e confira a seleção atual.",
  LAST_ADMINISTRATOR: "Mantenha os acessos de gestão do último administrador ativo.",
  SELF_ESCALATION_DENIED: "Peça a outro administrador para alterar os acessos da sua conta.",
  GRANT_BEYOND_AUTHORITY: "Você só pode alterar acessos que também possui.",
  PERMISSION_DENIED: "Você não tem permissão para alterar estes acessos.",
  ROLE_GRANT_DENIED: "Você não tem permissão para conceder acessos.",
  ROLE_REVOKE_DENIED: "Você não tem permissão para remover acessos.",
  AUTHENTICATION_REQUIRED: "Sua sessão expirou. Entre novamente.",
  USER_NOT_FOUND: "O colaborador não foi encontrado ou está desativado.",
  VALIDATION_FAILED: "Confira a seleção de acessos.",
};
export function UserAccessForm({
  userId,
  initial,
  authority,
  self,
  active,
}: Readonly<{
  userId: string;
  initial: { version: number; permissions: string[] };
  authority: string[];
  self: boolean;
  active: boolean;
}>) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useDraftState(`user-access-form:${userId}:snapshot`, initial);
  const [selected, setSelected] = useDraftState(
    `user-access-form:${userId}:selected`,
    new Set(initial.permissions),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const editable =
    !self && active && (authority.includes("roles:grant") || authority.includes("roles:revoke"));
  const changed = [...selected].sort().join() !== [...snapshot.permissions].sort().join();
  function canToggle(key: AccessPermission, checked: boolean) {
    return (
      editable &&
      !pending &&
      authority.includes(key) &&
      authority.includes(checked ? "roles:revoke" : "roles:grant")
    );
  }
  function toggle(key: AccessPermission, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      const required = accessPrerequisites[key] ?? [];
      if (required.some((permission) => !selected.has(permission) && !canToggle(permission, false)))
        return;
      required.forEach((permission) => next.add(permission));
      next.add(key);
    } else {
      const dependents = Object.entries(accessPrerequisites)
        .filter(([, required]) => required.includes(key))
        .map(([permission]) => permission as AccessPermission);
      if (dependents.some((permission) => selected.has(permission) && !canToggle(permission, true)))
        return;
      dependents.forEach((permission) => next.delete(permission));
      next.delete(key);
    }
    setSelected(next);
    setSaved(false);
    setError("");
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/v1/users/${userId}/access`, {
        method: "PUT",
        headers: { "content-type": "application/json", "x-csrf-token": crypto.randomUUID() },
        body: JSON.stringify({
          permissions: [...selected],
          expectedPermissions: snapshot.permissions,
          version: snapshot.version,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(errors[body.code] ?? "Não foi possível salvar os acessos. Tente novamente.");
        return;
      }
      setSnapshot(body);
      setSelected(new Set(body.permissions));

      setSaved(true);
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor. Sua seleção foi preservada.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="panel user-access-panel" aria-labelledby="user-access-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PERMISSÕES</p>
          <h2 id="user-access-title">Acessos do colaborador</h2>
        </div>
        <ShieldCheck aria-hidden="true" size={24} />
      </div>
      <p>
        Selecione os módulos e as ações que este colaborador pode usar. As alterações valem após
        salvar.
      </p>
      {self ? (
        <p className="muted-text">Outro administrador deve alterar os acessos da sua conta.</p>
      ) : null}
      {!active ? <p className="muted-text">Reative a conta antes de alterar os acessos.</p> : null}
      <DraftForm draftKey="users-user-access-form-1" onSubmit={save}>
        <div className="access-grid">
          {groups.map((group) => (
            <fieldset className="access-group" key={group.name}>
              <legend>{group.name}</legend>
              {group.actions.map(([key, label]) => (
                <label className="checkbox-field access-option" key={key}>
                  <DraftInput
                    type="checkbox"
                    checked={selected.has(key)}
                    disabled={!canToggle(key, selected.has(key))}
                    onChange={(event) => toggle(key, event.target.checked)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        {editable ? (
          <div className="access-save">
            <p className="muted-text">
              Ao salvar, esta seleção passa a definir todos os acessos da conta. Início,
              configurações pessoais e notícias públicas continuam disponíveis.
            </p>

            <Button intent="primary" type="submit" disabled={pending || !changed}>
              <Check size={18} aria-hidden="true" />
              {pending ? "Salvando…" : "Salvar acessos"}
            </Button>
          </div>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
        {saved ? <p role="status">Acessos atualizados.</p> : null}
      </DraftForm>
    </section>
  );
}
