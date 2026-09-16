"use client";
import { useDraftState } from "@/components/workspace-drafts";
import { DraftInput, DraftForm } from "@/components/ui/draft-controls";
import { FormField } from "@/components/ui/form-field";

import { PasswordInput } from "@/components/ui/password-input";
import { ValidatedTextField } from "@/components/ui/validated-text-field";
import { requiredEmailSchema, contactFieldMessages } from "@caab/contracts";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import type { accountSettingsRequestSchema } from "@caab/contracts";
import { newPasswordSchema, PASSWORD_MAX_LENGTH, PASSWORD_REQUIREMENTS } from "@caab/contracts";
import Link from "next/link";

const errors: Record<string, string> = {
  INVALID_PASSWORD: "Senha atual incorreta. Confira a senha e tente novamente.",
  PASSWORD_MISMATCH: "A confirmação da nova senha não coincide.",
  PASSWORD_UNCHANGED: "Escolha uma senha diferente da atual.",
  VERSION_CONFLICT:
    "Sua conta foi alterada em outra página. Atualize esta página antes de tentar novamente.",
  EMAIL_UNCHANGED: "Informe um e-mail diferente do atual.",
  EMAIL_UNAVAILABLE: "Este e-mail não está disponível. Confira o endereço informado.",
  EMAIL_LINK_INVALID:
    "O link é inválido, expirou ou já foi usado. Entre na conta correta ou solicite uma nova troca em Configurações.",
  EMAIL_DELIVERY_FAILED:
    "Não foi possível enviar a confirmação. Seu e-mail continua o mesmo. Tente novamente mais tarde.",
  EMAIL_REQUEST_LIMIT: "Aguarde um minuto antes de solicitar outro link.",
  TOO_MANY_ATTEMPTS:
    "Muitas tentativas com senha incorreta. Aguarde 15 minutos para tentar novamente.",
  EXTERNAL_CREDENTIAL:
    "Esta conta não possui senha local. Gerencie suas credenciais no provedor de identidade.",
  AUTHENTICATION_REQUIRED: "Sua sessão expirou. Entre novamente e repita a ação.",
  VALIDATION_FAILED:
    "Confira os campos e escolha uma senha forte, com maiúsculas, minúsculas e números.",
};

export async function saveSettings(input: z.input<typeof accountSettingsRequestSchema>) {
  const response = await fetch("/api/v1/me/settings", {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": crypto.randomUUID() },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      body?.code === "VALIDATION_FAILED" && input.action === "profile"
        ? "Informe um nome válido, com até 160 caracteres, sem usar apenas espaços."
        : typeof body?.code === "string" && Object.hasOwn(errors, body.code)
          ? errors[body.code]
          : "Não foi possível concluir a alteração. Tente novamente.",
    );
  return body as { version: number };
}

export function AccountSettingsForm({
  name,
  email,
  version: initialVersion,
  localMail,
}: Readonly<{ name: string; email: string; version: number; localMail: boolean }>) {
  const [version, setVersion] = useDraftState("account:version", initialVersion);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    action: string;
    message: string;
    error: boolean;
  } | null>(null);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    // The route's loading fallback can arrive before these anchored sections exist.
    const section = window.location.hash.slice(1);
    if (!["profile-title", "email-title", "password-title"].includes(section)) return;
    const frame = requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, []);

  async function submit(
    event: FormEvent<HTMLFormElement>,
    action: "profile" | "password" | "request-email",
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (key: string) => String(data.get(key) ?? "");
    setPending(action);
    setFeedback(null);
    try {
      const input: z.input<typeof accountSettingsRequestSchema> =
        action === "profile"
          ? { action, name: text("name").trim(), version }
          : action === "password"
            ? {
                action,

                currentPassword: text("currentPassword"),
                newPassword: text("newPassword"),
                confirmPassword: text("confirmPassword"),
                version,
              }
            : {
                action,

                currentPassword: text("currentPassword"),
                newEmail: text("newEmail").trim(),
                version,
              };
      if (input.action === "profile" && (!input.name || input.name.length > 160))
        throw new Error("Informe um nome válido, com até 160 caracteres, sem usar apenas espaços.");
      if (input.action === "password" && input.newPassword !== input.confirmPassword)
        throw new Error(errors.PASSWORD_MISMATCH);
      if (input.action === "password" && !newPasswordSchema.safeParse(input.newPassword).success)
        throw new Error("Escolha uma senha mais forte. " + PASSWORD_REQUIREMENTS);
      const saved = await saveSettings(input);
      setVersion(saved.version);
      form.reset();
      setFeedback({
        action,
        error: false,
        message:
          action === "profile"
            ? "Nome atualizado."
            : action === "password"
              ? "Senha alterada. As outras sessões foram encerradas."
              : "Confirmação enviada ao novo e-mail. Abra o link em até 30 minutos. Seu e-mail de acesso só muda após confirmar.",
      });
      router.refresh();
    } catch (failure) {
      setFeedback({
        action,
        error: true,
        message:
          failure instanceof TypeError
            ? "Não foi possível conectar ao servidor. Tente novamente."
            : failure instanceof Error
              ? failure.message
              : "Não foi possível concluir a alteração.",
      });
    } finally {
      setPending(null);
    }
  }
  function message(action: string) {
    return feedback?.action === action ? (
      <p role={feedback.error ? "alert" : "status"}>{feedback.message}</p>
    ) : null;
  }
  const disabled = !hydrated || pending !== null;
  return (
    <div className="settings-panels">
      <section className="panel" aria-labelledby="profile-title">
        <h2 id="profile-title">Perfil</h2>
        <DraftForm
          draftKey="auth-account-settings-form-1"
          onSubmit={(event) => submit(event, "profile")}
        >
          <FormField id="settings-name" label="Nome">
            <DraftInput
              key={name}
              id="settings-name"
              name="name"
              defaultValue={name}
              required
              maxLength={160}
              autoComplete="name"
            />
          </FormField>

          {message("profile")}
          <button className="primary-button compact-button" type="submit" disabled={disabled}>
            {pending === "profile" ? "Salvando…" : "Salvar nome"}
          </button>
        </DraftForm>
      </section>
      <section className="panel" aria-labelledby="email-title">
        <h2 id="email-title">E-mail de acesso</h2>
        <p>E-mail atual: {email}</p>
        <p>
          Confirme sua senha e valide o link enviado ao novo endereço. As outras sessões serão
          encerradas após confirmar a troca.
        </p>
        {localMail ? (
          <p>
            Ambiente local de testes: os links chegam à{" "}
            <a href="http://localhost:8025" target="_blank" rel="noreferrer">
              caixa de e-mails local
            </a>
            , sem envio externo.
          </p>
        ) : null}
        <DraftForm
          draftKey="auth-account-settings-form-2"
          onSubmit={(event) => submit(event, "request-email")}
        >
          <ValidatedTextField
            id="settings-email"
            label="Novo e-mail"
            name="newEmail"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            schema={requiredEmailSchema}
            message={contactFieldMessages.email}
          />
          <FormField id="email-password" label="Senha atual para trocar e-mail">
            <PasswordInput
              id="email-password"
              name="currentPassword"

              autoComplete="current-password"
              required
              maxLength={128}
            />
          </FormField>

          {message("request-email")}
          <button className="primary-button compact-button" type="submit" disabled={disabled}>
            {pending === "request-email" ? "Enviando…" : "Enviar confirmação"}
          </button>
        </DraftForm>
      </section>
      <section className="panel" aria-labelledby="password-title">
        <h2 id="password-title">Alterar senha</h2>
        <p>{PASSWORD_REQUIREMENTS}</p>
        <p>Ao salvar, as outras sessões serão encerradas.</p>
        <p>
          <Link href="/forgot-password">Redefinir senha por e-mail</Link>
        </p>
        <DraftForm
          draftKey="auth-account-settings-form-3"
          onSubmit={(event) => submit(event, "password")}
        >
          <FormField id="password-current" label="Senha atual para trocar senha">
            <PasswordInput
              id="password-current"
              name="currentPassword"

              autoComplete="current-password"
              maxLength={128}
              required
            />
          </FormField>
          <FormField id="password-new" label="Nova senha">
            <PasswordInput
              id="password-new"
              name="newPassword"

              autoComplete="new-password"
              minLength={12}
              maxLength={PASSWORD_MAX_LENGTH}
              required
            />
          </FormField>
          <FormField id="password-confirm" label="Confirmar nova senha">
            <PasswordInput
              id="password-confirm"
              name="confirmPassword"

              autoComplete="new-password"
              minLength={12}
              maxLength={PASSWORD_MAX_LENGTH}
              required
            />
          </FormField>

          {message("password")}
          <button className="primary-button compact-button" type="submit" disabled={disabled}>
            {pending === "password" ? "Salvando…" : "Alterar senha"}
          </button>
        </DraftForm>
      </section>
    </div>
  );
}
