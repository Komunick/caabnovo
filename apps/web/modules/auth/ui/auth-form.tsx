"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: Readonly<{ mode: "login" | "mfa" }>) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    const endpoint =
      mode === "login" ? "/api/auth/sign-in/email" : "/api/auth/two-factor/verify-totp";
    const body =
      mode === "login"
        ? { email: data.get("email"), password: data.get("password") }
        : { code: data.get("code"), trustDevice: false };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => ({}))) as { twoFactorRedirect?: boolean };
      if (!response.ok) {
        setError(mode === "mfa" ? "Código inválido. Tente novamente." : "Credenciais inválidas.");
        return;
      }
      router.replace(payload.twoFactorRedirect ? "/mfa" : "/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form method="post" onSubmit={submit} noValidate>
      {mode === "login" ? (
        <>
          <div className="form-field">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="form-field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </>
      ) : (
        <div className="form-field">
          <label htmlFor="code">Código de verificação</label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
        </div>
      )}
      {error ? <p role="alert">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={pending || !hydrated}>
        {pending || !hydrated ? "Aguarde…" : mode === "login" ? "Entrar" : "Verificar"}
      </button>
    </form>
  );
}
