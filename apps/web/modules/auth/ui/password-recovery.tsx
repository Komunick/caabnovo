"use client";

import { PasswordInput } from "@/components/ui/password-input";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  newPasswordSchema,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REQUIREMENTS,
} from "@caab/contracts";

export function PasswordRecovery({
  reset = false,
  localMail = false,
}: Readonly<{ reset?: boolean; localMail?: boolean }>) {
  const [token, setToken] = useState("");
  const captured = useRef(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (captured.current) return;
    captured.current = true;
    if (reset) {
      setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
      window.history.replaceState(null, "", window.location.pathname);
    }
    setReady(true);
  }, [reset]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setPending(true);
    try {
      const newPassword = String(data.get("newPassword") ?? "");
      if (reset && newPassword !== data.get("confirmation"))
        throw new Error("A confirmação da senha não coincide.");
      if (reset && !newPasswordSchema.safeParse(newPassword).success)
        throw new Error("Escolha uma senha mais forte. " + PASSWORD_REQUIREMENTS);
      const response = await fetch(
        `/api/auth/${reset ? "reset-password" : "request-password-reset"}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            reset ? { token, newPassword } : { email: String(data.get("email") ?? "").trim() },
          ),
        },
      );
      const body = await response.json().catch(() => null);
      if (response.status === 429)
        throw new Error("Muitas tentativas. Aguarde um minuto e tente novamente.");
      if (response.status >= 500)
        throw new Error("A recuperação está indisponível no momento. Tente novamente mais tarde.");
      if (!reset && !response.ok)
        throw new Error(
          "Não foi possível solicitar a recuperação. Confira o e-mail e tente novamente.",
        );
      if (reset && !response.ok)
        throw new Error(
          body?.code === "PASSWORD_POLICY_FAILED"
            ? "Escolha uma senha mais forte. " + PASSWORD_REQUIREMENTS
            : "O link é inválido, expirou ou já foi usado. Solicite uma nova redefinição.",
        );
      // Keep the same response for registered and unregistered addresses.
      form.reset();
      setToken("");
      setDone(true);
    } catch (failure) {
      setError(
        failure instanceof TypeError
          ? "Não foi possível conectar. Tente novamente."
          : failure instanceof Error
            ? failure.message
            : "Não foi possível concluir a solicitação.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="page-stack">
      {done ? (
        <p role="status">
          {reset
            ? "Senha redefinida. Entre novamente com sua nova senha."
            : "Se houver uma conta com esse e-mail, você receberá um link para redefinir sua senha."}
        </p>
      ) : (
        <form onSubmit={submit}>
          {reset ? (
            <>
              <p>{PASSWORD_REQUIREMENTS}</p>
              <div className="form-field">
                <label htmlFor="reset-password">Nova senha</label>
                <PasswordInput
                  id="reset-password"
                  name="newPassword"

                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="reset-confirmation">Confirmar nova senha</label>
                <PasswordInput
                  id="reset-confirmation"
                  name="confirmation"

                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  required
                />
              </div>
              {ready && !token ? <p>Abra o link recebido no e-mail ou solicite outro.</p> : null}
            </>
          ) : (
            <div className="form-field">
              <label htmlFor="recovery-email">E-mail da conta</label>
              <input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </div>
          )}
          <button
            className="primary-button"
            type="submit"
            disabled={!ready || pending || (reset && !token)}
          >
            {pending ? "Aguarde…" : reset ? "Redefinir senha" : "Enviar link de recuperação"}
          </button>
        </form>
      )}
      {error ? <p role="alert">{error}</p> : null}
      {localMail && !reset ? (
        <p>
          Teste local: confira a{" "}
          <a href="http://localhost:8025" target="_blank" rel="noreferrer">
            caixa de e-mails local
          </a>
          .
        </p>
      ) : null}
      {reset && !done ? <Link href="/forgot-password">Solicitar novo link</Link> : null}
      <Link href="/login">Voltar ao login</Link>
    </div>
  );
}
