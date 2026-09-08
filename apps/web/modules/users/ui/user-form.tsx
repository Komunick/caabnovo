"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Role, User } from "@caab/contracts";
import { SensitiveActionDialog } from "./sensitive-action-dialog";

type UserFormProps =
  | { mode: "create"; roles: Role[]; user?: never; canDisable?: never }
  | { mode: "edit"; user: User; roles?: never; canDisable: boolean };

function mutationHeaders(idempotencyKey?: string) {
  return {
    "content-type": "application/json",
    "x-csrf-token": crypto.randomUUID(),
    ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
  };
}

async function errorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  return payload?.message ?? "Não foi possível salvar a alteração.";
}

export function UserForm(props: Readonly<UserFormProps>) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setHydrated(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const editing = props.mode === "edit";
    const response = await fetch(editing ? `/api/v1/users/${props.user.id}` : "/api/v1/users", {
      method: editing ? "PATCH" : "POST",
      headers: mutationHeaders(editing ? undefined : crypto.randomUUID()),
      body: JSON.stringify(
        editing
          ? {
              name: data.get("name"),
              version: props.user.version,
              justification: data.get("justification"),
            }
          : {
              name: data.get("name"),
              email: data.get("email"),
              roleIds: data.getAll("roleIds"),
              justification: data.get("justification"),
            },
      ),
    });
    if (!response.ok) {
      setError(await errorMessage(response));
    } else {
      if (!editing) {
        const created = (await response.json()) as { id?: string };
        if (!created.id) {
          setError("O usuário foi criado, mas não foi possível abrir o cadastro.");
          setPending(false);
          return;
        }
        router.push(`/users/${created.id}`);
        return;
      }
      setMessage("Alterações salvas.");
      router.refresh();
    }
    setPending(false);
  }

  async function disable(reason: string) {
    if (props.mode !== "edit") return;
    const response = await fetch(`/api/v1/users/${props.user.id}`, {
      method: "PATCH",
      headers: mutationHeaders(),
      body: JSON.stringify({
        status: "disabled",
        version: props.user.version,
        justification: reason,
      }),
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    router.refresh();
  }

  return (
    <section className="panel" aria-labelledby={`${props.mode}-user-title`}>
      <h2 id={`${props.mode}-user-title`}>
        {props.mode === "create" ? "Criar usuário" : "Dados da conta"}
      </h2>
      <form onSubmit={submit}>
        <div className="form-field">
          <label htmlFor={`${props.mode}-name`}>Nome</label>
          <input
            id={`${props.mode}-name`}
            name="name"
            defaultValue={props.mode === "edit" ? props.user.name : ""}
            maxLength={160}
            required
          />
        </div>
        {props.mode === "create" ? (
          <>
            <div className="form-field">
              <label htmlFor="create-email">E-mail</label>
              <input id="create-email" name="email" type="email" required />
            </div>
            {props.roles.length ? (
              <fieldset>
                <legend>Funções iniciais</legend>
                {props.roles.map((role) => (
                  <label className="checkbox-field" key={role.id}>
                    <input name="roleIds" type="checkbox" value={role.id} /> {role.name}
                  </label>
                ))}
              </fieldset>
            ) : null}
          </>
        ) : null}
        <div className="form-field">
          <label htmlFor={`${props.mode}-justification`}>Justificativa</label>
          <textarea id={`${props.mode}-justification`} name="justification" rows={3} required />
        </div>
        {error ? <p role="alert">{error}</p> : null}
        {message ? <p role="status">{message}</p> : null}
        <button
          className="primary-button compact-button"
          type="submit"
          disabled={!hydrated || pending}
        >
          {pending ? "Aguarde…" : props.mode === "create" ? "Criar usuário" : "Salvar alterações"}
        </button>
      </form>
      {props.mode === "edit" && props.canDisable && props.user.status === "active" ? (
        <SensitiveActionDialog
          triggerLabel="Desativar usuário"
          title="Desativar usuário"
          fieldLabel="Justificativa da desativação"
          confirmLabel="Confirmar desativação"
          onConfirm={disable}
        />
      ) : null}
    </section>
  );
}
