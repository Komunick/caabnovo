"use client";
import { useDraftState } from "@/components/workspace-drafts";
import { DraftSelect, DraftForm } from "@/components/ui/draft-controls";
import { FormField } from "@/components/ui/form-field";

import { Plus } from "lucide-react";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Role, RoleReference } from "@caab/contracts";
import { SensitiveActionDialog } from "./sensitive-action-dialog";
import { roleGrantError } from "./role-grant-error";

function headers() {
  return { "content-type": "application/json", "x-csrf-token": crypto.randomUUID() };
}

export function RoleAssignmentForm({
  userId,
  roles,
  assignedRoles,
  canGrant,
  canRevoke,
  children,
}: Readonly<{
  userId: string;
  roles: Role[];
  assignedRoles: RoleReference[];
  canGrant: boolean;
  canRevoke: boolean;
  children?: ReactNode;
}>) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useDraftState("users-role-assignment-form-1:error", "");
  const assigned = new Set(assignedRoles.map(({ id }) => id));
  const available = roles.filter(({ id }) => !assigned.has(id));

  useEffect(() => setHydrated(true), []);

  async function grant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const roleId = String(data.get("roleId") ?? "");
    try {
      const response = await fetch(`/api/v1/users/${userId}/roles/${roleId}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(roleGrantError(body?.code));
      } else {
        form.reset();
        router.refresh();
      }
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function revoke(roleId: string) {
    const url = new URL(`/api/v1/users/${userId}/roles/${roleId}`, window.location.origin);
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
                  confirmLabel="Confirmar revogação"
                  onConfirm={() => revoke(role.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma função ativa.</p>
      )}
      {children}
      {canGrant && available.length ? (
        <DraftForm draftKey="users-role-assignment-form-1" onSubmit={grant}>
          <FormField id="role-id" label="Função">
            <DraftSelect id="role-id" name="roleId" required defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              {available.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </DraftSelect>
          </FormField>

          {error ? <p role="alert">{error}</p> : null}
          <button
            className="primary-button button--add"
            type="submit"
            disabled={!hydrated || pending}
          >
            <Plus size={20} aria-hidden="true" />
            {pending ? "Aguarde…" : "Conceder função"}
          </button>
        </DraftForm>
      ) : null}
    </section>
  );
}
