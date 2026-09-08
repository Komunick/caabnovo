"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Role, RoleReference } from "@caab/contracts";
import { SensitiveActionDialog } from "./sensitive-action-dialog";

function headers() {
  return { "content-type": "application/json", "x-csrf-token": crypto.randomUUID() };
}

export function RoleAssignmentForm({
  userId,
  roles,
  assignedRoles,
  canGrant,
  canRevoke,
}: Readonly<{
  userId: string;
  roles: Role[];
  assignedRoles: RoleReference[];
  canGrant: boolean;
  canRevoke: boolean;
}>) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const assigned = new Set(assignedRoles.map(({ id }) => id));
  const available = roles.filter(({ id }) => !assigned.has(id));

  useEffect(() => setHydrated(true), []);

  async function grant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const roleId = String(data.get("roleId") ?? "");
    const response = await fetch(`/api/v1/users/${userId}/roles/${roleId}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ justification: data.get("justification") }),
    });
    if (!response.ok) setError("Não foi possível conceder a função.");
    else router.refresh();
    setPending(false);
  }

  async function revoke(roleId: string, reason: string) {
    const url = new URL(`/api/v1/users/${userId}/roles/${roleId}`, window.location.origin);
    url.searchParams.set("justification", reason);
    const response = await fetch(url, { method: "DELETE", headers: headers() });
    if (!response.ok) throw new Error("Role revocation failed");
    router.refresh();
  }

  return (
    <section className="panel" aria-labelledby="role-assignment-title">
      <h2 id="role-assignment-title">Funções e permissões</h2>
      {assignedRoles.length ? (
        <ul className="role-list">
          {assignedRoles.map((role) => (
            <li key={role.id}>
              <span>{role.name}</span>
              {canRevoke ? (
                <SensitiveActionDialog
                  triggerLabel={`Revogar ${role.name}`}
                  title={`Revogar ${role.name}`}
                  fieldLabel="Motivo da revogação"
                  confirmLabel="Confirmar revogação"
                  onConfirm={(reason) => revoke(role.id, reason)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma função ativa.</p>
      )}
      {canGrant && available.length ? (
        <form onSubmit={grant}>
          <div className="form-field">
            <label htmlFor="role-id">Função</label>
            <select id="role-id" name="roleId" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {available.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="role-justification">Justificativa da função</label>
            <textarea id="role-justification" name="justification" rows={3} required />
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <button
            className="primary-button compact-button"
            type="submit"
            disabled={!hydrated || pending}
          >
            {pending ? "Aguarde…" : "Conceder função"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
