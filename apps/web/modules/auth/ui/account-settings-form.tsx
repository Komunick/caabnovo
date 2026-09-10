"use client";

import { PasswordInput } from "@/components/ui/password-input";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AccountSettingsRequest } from "@caab/contracts";
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

export async function saveSettings(input: AccountSettingsRequest) {
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
  version,
  localMail,
}: Readonly<{ name: string; email: string; version: number; localMail: boolean }>) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    action: string;
    message: string;
    error: boolean;
  } | null>(null);
  useEffect(() => setHydrated(true), []);

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
      const input: AccountSettingsRequest =
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
      await saveSettings(input);
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
    <>
      <section className="panel" aria-labelledby="profile-title">
        <h2 id="profile-title">Perfil</h2>
        <form onSubmit={(event) => submit(event, "profile")}>
          <div className="form-field">
            <label htmlFor="settings-name">Nome</label>
            <input
              key={name}
              id="settings-name"
              name="name"
              defaultValue={name}
              required
              maxLength={160}
              autoComplete="name"
            />
          </div>
          {message("profile")}
          <button className="primary-button compact-button" type="submit" disabled={disabled}>
            {pending === "profile" ? "Salvando…" : "Salvar nome"}
          </button>
        </form>
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
        <form onSubmit={(event) => submit(event, "request-email")}>
          <div className="form-field">
            <label htmlFor="settings-email">Novo e-mail</label>
            <input
              id="settings-email"
              name="newEmail"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="email-password">Senha atual para trocar e-mail</label>
            <PasswordInput
              id="email-password"
              name="currentPassword"

              autoComplete="current-password"
              required
              maxLength={128}
            />
          </div>
          {message("request-email")}
          <button className="primary-button compact-button" type="submit" disabled={disabled}>
            {pending === "request-email" ? "Enviando…" : "Enviar confirmação"}
          </button>
        </form>
      </section>
      <section className="panel" aria-labelledby="password-title">
        <h2 id="password-title">Alterar senha</h2>
        <p>{PASSWORD_REQUIREMENTS}</p>
        <p>Ao salvar, as outras sessões serão encerradas.</p>
        <p>
          <Link href="/forgot-password">Redefinir senha por e-mail</Link>
        </p>
        <form onSubmit={(event) => submit(event, "password")}>
          <div className="form-field">
            <label htmlFor="password-current">Senha atual para trocar senha</label>
            <PasswordInput
              id="password-current"
              name="currentPassword"

              autoComplete="current-password"
              maxLength={128}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password-new">Nova senha</label>
            <PasswordInput
              id="password-new"
              name="newPassword"

              autoComplete="new-password"
              minLength={12}
              maxLength={PASSWORD_MAX_LENGTH}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password-confirm">Confirmar nova senha</label>
            <PasswordInput
              id="password-confirm"
              name="confirmPassword"

              autoComplete="new-password"
              minLength={12}
              maxLength={PASSWORD_MAX_LENGTH}
              required
            />
          </div>
          {message("password")}
          <button className="primary-button compact-button" type="submit" disabled={disabled}>
            {pending === "password" ? "Salvando…" : "Alterar senha"}
          </button>
        </form>
      </section>
    </>
  );
}
