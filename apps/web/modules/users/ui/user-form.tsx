"use client";
import { RoleOptions } from "./role-options";
import { useDraftCache, useDraftState } from "@/components/workspace-drafts";
import { DraftInput, DraftForm } from "@/components/ui/draft-controls";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

import { Plus } from "lucide-react";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CreatedUser, Role, User, UserCpfLookupResult } from "@caab/contracts";
import {
  requiredEmailSchema,
  contactFieldMessages,
  userCpfSchema,
  userPhoneSchema,
  createUserRequestSchema,
  updateUserRequestSchema,
  userCpfLookupResultSchema,
} from "@caab/contracts";
import { BrazilianAddressFields } from "@/components/ui/brazilian-address-fields";
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
  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    code?: string;
  } | null;
  if (payload?.code === "USER_CPF_CONFLICT") return "Este CPF já está cadastrado em Colaboradores.";
  if (payload?.code === "USER_EMAIL_CONFLICT") return "Este e-mail já está cadastrado.";
  if (payload?.code === "USER_VERSION_CONFLICT")
    return "O cadastro foi alterado por outra pessoa. Recarregue e confira os dados antes de salvar.";
  if (payload?.code === "VALIDATION_FAILED")
    return "Confira os campos obrigatórios e os dados informados.";
  return payload?.message ?? "Não foi possível salvar a alteração.";
}

export function UserForm(props: Readonly<UserFormProps>) {
  const drafts = useDraftCache();
  const [version, setVersion] = useDraftState("user-form:version", props.user?.version);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useDraftState("users-user-form-1:error", "");
  // Credential receipts are intentionally excluded from persistent form drafts.
  const [created, setCreated] = useState<CreatedUser | null>(null);
  const attempt = useRef<{ body: string; key: string } | null>(null);
  const [cpfQuery, setCpfQuery] = useDraftState("user-form:cpf-query", "");
  const [cpfMatch, setCpfMatch] = useState<UserCpfLookupResult | null>(null);
  const [cpfError, setCpfError] = useState("");

  async function lookupCpf(cpf: string, signal?: AbortSignal) {
    const response = await fetch("/api/v1/users/lookup-cpf", {
      method: "POST",
      headers: mutationHeaders(),
      body: JSON.stringify({ cpf }),
      cache: "no-store",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(5000)])
        : AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error("Não foi possível consultar o CPF. Tente novamente.");
    return userCpfLookupResultSchema.parse(await response.json());
  }

  useEffect(() => {
    setCpfMatch(null);
    setCpfError("");
    if (props.mode !== "create" || !userCpfSchema.safeParse(cpfQuery).success) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void lookupCpf(cpfQuery, controller.signal)
        .then((match) => {
          if (!controller.signal.aborted) setCpfMatch(match);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setCpfError("Não foi possível consultar o CPF. A consulta será repetida ao cadastrar.");
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cpfQuery, props.mode]);

  useEffect(() => setHydrated(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const editing = props.mode === "edit";
    const address = Object.fromEntries(
      ["postalCode", "street", "number", "complement", "neighborhood", "city", "state"].map(
        (key) => [key, String(data.get(key) ?? "")],
      ),
    );
    const contact = {
      ...(data.get("cpf") || !editing || props.user?.cpf
        ? { cpf: String(data.get("cpf") ?? "") }
        : {}),
      ...(data.get("phone") || !editing || props.user?.phone
        ? { phone: String(data.get("phone") ?? "") }
        : {}),
      ...(!editing || props.user?.address || Object.values(address).some((value) => value.trim())
        ? { address }
        : {}),
    };
    const payload = editing
      ? {
          name: data.get("name"),
          ...contact,
          version,
        }
      : {
          name: data.get("name"),
          email: data.get("email"),
          ...contact,
          roleIds: data.getAll("roleIds").filter(Boolean),
        };
    const validated = (editing ? updateUserRequestSchema : createUserRequestSchema).safeParse(
      payload,
    );
    if (!validated.success) {
      const labels: Record<string, string> = {
        name: "Nome",
        cpf: "CPF",
        phone: "Telefone",
        email: "E-mail",
        address: "Endereço (rua, número, bairro, cidade e UF; CEP opcional)",
      };
      setError(
        `Confira: ${[...new Set(validated.error.issues.map((issue) => labels[String(issue.path[0])] ?? "Dados do cadastro"))].join(", ")}.`,
      );
      setPending(false);
      return;
    }
    const body = JSON.stringify(validated.data);
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
        if (!editing && response.status === 409)
          setCpfMatch(await lookupCpf(String(data.get("cpf") ?? "")).catch(() => null));
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
          setCpfQuery("");
          drafts.clear();
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
      <DraftForm draftKey="users-user-form-1" className="user-create-form" onSubmit={submit}>
        <p className="user-contact-instructions">
          Nome, CPF, e-mail, telefone e endereço são obrigatórios para novos colaboradores. CEP e
          complemento são opcionais. Cadastros existentes podem ser completados aos poucos.
        </p>
        <FormField id={`${props.mode}-name`} label="Nome">
          <DraftInput
            id={`${props.mode}-name`}
            name="name"
            defaultValue={props.mode === "edit" ? props.user.name : ""}
            maxLength={160}
            autoComplete="name"
            required
          />
        </FormField>
        <ValidatedTextField
          id={`${props.mode}-cpf`}
          name="cpf"
          label="CPF"
          mask="cpf"
          schema={
            props.mode === "edit" && !props.user.cpf
              ? {
                  safeParse: (value: unknown) => ({
                    success: value === "" || userCpfSchema.safeParse(value).success,
                  }),
                }
              : userCpfSchema
          }
          message="Informe um CPF válido."
          required={props.mode === "create" || !!props.user.cpf}
          defaultValue={props.user?.cpf ?? ""}
          maxLength={14}
          onValueChange={props.mode === "create" ? (input) => setCpfQuery(input.value) : undefined}
        />
        {props.mode === "create" && cpfError && <p role="status">{cpfError}</p>}
        {props.mode === "create" && cpfMatch?.status === "existing" && (
          <p role="alert">Este CPF já está cadastrado em Colaboradores.</p>
        )}
        {props.mode === "create" && cpfMatch?.status === "deleted" && (
          <div className="page-stack" role="status">
            <p>Este CPF pertence a um colaborador excluído.</p>
            <p>Motivo da exclusão: {cpfMatch.reason || "Motivo não registrado"}</p>
            {cpfMatch.canRestore ? (
              <SensitiveActionDialog
                triggerLabel="Reativar colaborador existente"
                title="Reativar colaborador existente"
                confirmLabel="Confirmar reativação"
                description="Os dados anteriores serão mantidos. O cadastro será aberto para revisão; os dados digitados nesta inclusão não serão aplicados."
                onConfirm={async () => {
                  const response = await fetch(`/api/v1/users/${cpfMatch.id}/lifecycle`, {
                    method: "POST",
                    headers: mutationHeaders(),
                    body: JSON.stringify({ action: "restore", version: cpfMatch.version }),
                  });
                  if (!response.ok) {
                    const message = await errorMessage(response);
                    setError(message);
                    throw new Error(message);
                  }
                  drafts.clear();
                  router.push(`/users/${cpfMatch.id}`);
                  router.refresh();
                }}
              />
            ) : (
              <p>Você não tem permissão para reativar este colaborador.</p>
            )}
          </div>
        )}
        {props.mode === "create" && (
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
        )}
        <ValidatedTextField
          id={`${props.mode}-phone`}
          name="phone"
          label="Telefone"
          mask="phone"
          schema={
            props.mode === "edit" && !props.user.phone
              ? {
                  safeParse: (value: unknown) => ({
                    success: value === "" || userPhoneSchema.safeParse(value).success,
                  }),
                }
              : userPhoneSchema
          }
          message={contactFieldMessages.phone}
          required={props.mode === "create" || !!props.user.phone}
          defaultValue={props.user?.phone ?? ""}
          autoComplete="tel"
          maxLength={15}
        />
        <div className="user-contact-address">
          <h3>Endereço</h3>
          <BrazilianAddressFields
            prefix={`${props.mode}-user`}
            initial={props.user?.address ?? undefined}
            required={props.mode === "create"}
            postalCodeRequired={false}
            preserveRequired={props.mode === "edit"}
          />
        </div>
        {props.mode === "create" ? (
          <>
            {props.roles.length ? (
              <RoleOptions roles={props.roles} name="roleIds" optional />
            ) : null}
          </>
        ) : null}

        {error ? <p role="alert">{error}</p> : null}
        {message ? <p role="status">{message}</p> : null}
        <Button
          intent="primary"
          size={props.mode === "create" ? "add" : "compact"}
          type="submit"
          disabled={!hydrated || pending}
        >
          {props.mode === "create" && <Plus size={20} aria-hidden="true" />}
          {pending
            ? "Aguarde…"
            : props.mode === "create"
              ? "Criar colaborador"
              : "Salvar alterações"}
        </Button>
      </DraftForm>
    </section>
  );
}
