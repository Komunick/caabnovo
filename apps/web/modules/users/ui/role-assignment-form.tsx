"use client";
import { RoleOptions, roleDescription } from "./role-options";
import { useDraftState } from "@/components/workspace-drafts";
import { DraftForm } from "@/components/ui/draft-controls";

import { Plus } from "lucide-react";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { nextRoleCode, type Role, type RoleReference } from "@caab/contracts";
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
  active,
  children,
}: Readonly<{
  userId: string;
  roles: Role[];
  assignedRoles: RoleReference[];
  canGrant: boolean;
  canRevoke: boolean;
  active: boolean;
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

  async function promote(roleId: string) {
    const response = await fetch(`/api/v1/users/${userId}/roles/${roleId}/promote`, {
      method: "POST",
      headers: headers(),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw Object.assign(new Error("Promotion failed"), { code: body?.code });
    }
    router.refresh();
  }

  return (
    <section className="panel" aria-labelledby="role-assignment-title">
      <h2 id="role-assignment-title">Funções e permissões</h2>
      {assignedRoles.length ? (
        <ul className="role-list">
          {assignedRoles.map((role) => {
            const next = roles.find((candidate) => candidate.code === nextRoleCode(role.code));
            return (
              <li key={role.id}>
                <span>
                  {role.name}
                  <small className="role-description">
                    {roleDescription(roles.find((candidate) => candidate.id === role.id) ?? role)}
                  </small>
                </span>
                <div className="role-actions">
                  {canGrant && canRevoke && active && next ? (
                    <SensitiveActionDialog
                      triggerLabel="Promover"
                      title={`Promover para ${next.name}`}
                      confirmLabel="Confirmar promoção"
                      description={`O cargo ${role.name} será substituído por ${next.name}. ${roleDescription(next)}`}
                      intent="secondary"
                      errorMessage={(error) =>
                        roleGrantError(
                          typeof error === "object" && error && "code" in error
                            ? String(error.code)
                            : undefined,
                        )
                      }
                      onConfirm={() => promote(role.id)}
                    />
                  ) : null}
                  {canRevoke ? (
                    <SensitiveActionDialog
                      triggerLabel={`Revogar ${role.name}`}
                      title={`Revogar ${role.name}`}
                      confirmLabel="Confirmar revogação"
                      onConfirm={() => revoke(role.id)}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>Nenhuma função ativa.</p>
      )}
      {assignedRoles.length > 0 && canGrant && (
        <p className="role-description">Cada colaborador pode ter apenas um cargo vigente.</p>
      )}
      {children}
      {canGrant && assignedRoles.length === 0 && available.length ? (
        <DraftForm draftKey="users-role-assignment-form-1" onSubmit={grant}>
          <RoleOptions roles={available} name="roleId" />

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
