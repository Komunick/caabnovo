"use client";
import { useDraftCache, useDraftState } from "@/components/workspace-drafts";
import { DraftInput, DraftForm } from "@/components/ui/draft-controls";
import { FormField } from "@/components/ui/form-field";

import { Plus } from "lucide-react";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CreatedUser, Role, User } from "@caab/contracts";
import { requiredEmailSchema, contactFieldMessages } from "@caab/contracts";
import { ValidatedTextField } from "@/components/ui/validated-text-field";
import { SensitiveActionDialog } from "./sensitive-action-dialog";
import { InitialPasswordReceipt } from "./initial-password";

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
  const drafts = useDraftCache();
  const [version, setVersion] = useDraftState("user-form:version", props.user?.version);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Credential receipts are intentionally excluded from persistent form drafts.
  const [created, setCreated] = useState<CreatedUser | null>(null);
  const attempt = useRef<{ body: string; key: string } | null>(null);

  useEffect(() => setHydrated(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const editing = props.mode === "edit";
    const body = JSON.stringify(
      editing
        ? {
            name: data.get("name"),
            version,
          }
        : {
            name: data.get("name"),
            email: data.get("email"),
            roleIds: data.getAll("roleIds"),
          },
    );
    if (!editing && attempt.current?.body !== body)
      attempt.current = { body, key: crypto.randomUUID() };
    try {
      const response = await fetch(editing ? `/api/v1/users/${props.user.id}` : "/api/v1/users", {
        method: editing ? "PATCH" : "POST",
        headers: mutationHeaders(editing ? undefined : attempt.current!.key),
        body,
        cache: "no-store",
      });
      if (!response.ok) {
        setError(await errorMessage(response));
      } else {
        drafts.clear("users-user-form-1:");
        if (!editing) {
          const created = (await response.json()) as CreatedUser;
          if (!created.id) {
            setError("O colaborador foi criado, mas não foi possível abrir o cadastro.");
            setPending(false);
            return;
          }
          setCreated(created);
          attempt.current = null;
          return;
        }
        const saved = await response.json();
        setVersion(saved.version);
        setMessage("Alterações salvas.");
        router.refresh();
      }
    } catch {
      setError(
        "Não foi possível confirmar o cadastro. Tente novamente; um envio repetido não criará outra conta.",
      );
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    if (props.mode !== "edit") return;
    const response = await fetch(`/api/v1/users/${props.user.id}`, {
      method: "PATCH",
      headers: mutationHeaders(),
      body: JSON.stringify({
        status: "disabled",
        version,
      }),
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    router.refresh();
  }

  if (created)
    return (
      <InitialPasswordReceipt
        password={created.initialPassword}
        email={created.email}
        userId={created.id}
        onDone={() => setCreated(null)}
      />
    );

  return (
    <section className="panel" aria-labelledby={`${props.mode}-user-title`}>
      <h2 id={`${props.mode}-user-title`}>
        {props.mode === "create" ? "Criar colaborador" : "Dados da conta"}
      </h2>
      <DraftForm
        draftKey="users-user-form-1"
        className={props.mode === "create" ? "user-create-form" : undefined}
        onSubmit={submit}
      >
        <FormField id={`${props.mode}-name`} label="Nome">
          <DraftInput
            id={`${props.mode}-name`}
            name="name"
            defaultValue={props.mode === "edit" ? props.user.name : ""}
            maxLength={160}
            required
          />
        </FormField>
        {props.mode === "create" ? (
          <>
            <ValidatedTextField
              id="create-email"
              label="E-mail"
              name="email"
              type="email"
              required
              maxLength={254}
              schema={requiredEmailSchema}
              message={contactFieldMessages.email}
            />
            {props.roles.length ? (
              <fieldset className="user-role-options">
                <legend>Funções iniciais</legend>
                {props.roles.map((role) => (
                  <label className="checkbox-field" key={role.id}>
                    <DraftInput name="roleIds" type="checkbox" value={role.id} /> {role.name}
                  </label>
                ))}
              </fieldset>
            ) : null}
          </>
        ) : null}

        {error ? <p role="alert">{error}</p> : null}
        {message ? <p role="status">{message}</p> : null}
        <button
          className={`primary-button ${props.mode === "create" ? "button--add" : "compact-button"}`}
          type="submit"
          disabled={!hydrated || pending}
        >
          {props.mode === "create" && <Plus size={20} aria-hidden="true" />}
          {pending
            ? "Aguarde…"
            : props.mode === "create"
              ? "Criar colaborador"
              : "Salvar alterações"}
        </button>
      </DraftForm>
      {props.mode === "edit" && props.canDisable && props.user.status === "active" ? (
        <div className="user-danger-action">
          <SensitiveActionDialog
            triggerLabel="Desativar colaborador"
            title="Desativar colaborador"
            confirmLabel="Confirmar desativação"
            onConfirm={disable}
          />
        </div>
      ) : null}
    </section>
  );
}
