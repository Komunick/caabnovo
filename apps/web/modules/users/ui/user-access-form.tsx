"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { accessPrerequisites, type AccessPermission } from "@caab/contracts";
import { Button } from "@/components/ui/button";

const groups: { name: string; actions: [AccessPermission, string][] }[] = [
  {
    name: "Notícias",
    actions: [
      ["news:read", "Consultar notícias e rascunhos"],
      ["news:write", "Criar e editar notícias"],
      ["news:publish", "Publicar, programar e arquivar notícias"],
    ],
  },
  {
    name: "Associados",
    actions: [
      ["members:read", "Consultar associados"],
      ["members:write", "Cadastrar e editar associados"],
      ["members:review", "Analisar documentos e situações"],
    ],
  },
  {
    name: "Colaboradores",
    actions: [
      ["users:read", "Consultar colaboradores"],
      ["users:create", "Criar colaboradores"],
      ["users:update", "Editar colaboradores"],
      ["users:disable", "Desativar colaboradores"],
    ],
  },
  {
    name: "Gestão de acessos",
    actions: [
      ["roles:read", "Consultar perfis de acesso"],
      ["roles:grant", "Conceder acessos"],
      ["roles:revoke", "Remover acessos"],
    ],
  },
  {
    name: "Auditoria",
    actions: [
      ["audit:read", "Consultar eventos"],
      ["audit:export", "Exportar eventos"],
    ],
  },
  {
    name: "Processamentos",
    actions: [
      ["jobs:read", "Consultar processamentos"],
      ["jobs:redrive", "Reprocessar falhas"],
    ],
  },
  {
    name: "Arquivos",
    actions: [
      ["files:read", "Consultar e baixar arquivos"],
      ["files:create", "Enviar arquivos"],
      ["files:delete", "Excluir arquivos"],
    ],
  },
];
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
  VALIDATION_FAILED: "Confira a seleção e informe uma justificativa.",
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
  const [snapshot, setSnapshot] = useState(initial);
  const [selected, setSelected] = useState(new Set(initial.permissions));
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setSnapshot(initial);
    setSelected(new Set(initial.permissions));
  }, [initial]);
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
          justification: reason,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(errors[body.code] ?? "Não foi possível salvar os acessos. Tente novamente.");
        return;
      }
      setSnapshot(body);
      setSelected(new Set(body.permissions));
      setReason("");
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
      <form onSubmit={save}>
        <div className="access-grid">
          {groups.map((group) => (
            <fieldset className="access-group" key={group.name}>
              <legend>{group.name}</legend>
              {group.actions.map(([key, label]) => (
                <label className="checkbox-field access-option" key={key}>
                  <input
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
            <div className="form-field">
              <label htmlFor="access-reason">Justificativa dos acessos</label>
              <textarea
                id="access-reason"
                rows={2}
                required
                maxLength={1000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={pending}
              />
            </div>
            <Button intent="primary" type="submit" disabled={pending || !changed || !reason.trim()}>
              <Check size={18} aria-hidden="true" />
              {pending ? "Salvando…" : "Salvar acessos"}
            </Button>
          </div>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
        {saved ? <p role="status">Acessos atualizados.</p> : null}
      </form>
    </section>
  );
}
