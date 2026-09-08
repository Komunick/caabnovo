"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

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
          <FormField id="email" label="E-mail">
            <Input name="email" type="email" autoComplete="username" required />
          </FormField>
          <FormField id="password" label="Senha">
            <Input name="password" type="password" autoComplete="current-password" required />
          </FormField>
        </>
      ) : (
        <FormField id="code" label="Código de verificação">
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
        </FormField>
      )}
      {error ? <Alert>{error}</Alert> : null}
      <Button intent="primary" type="submit" disabled={pending || !hydrated}>
        {pending || !hydrated ? (
          <>
            <Spinner label="Autenticando" /> Aguarde…
          </>
        ) : mode === "login" ? (
          "Entrar"
        ) : (
          "Verificar"
        )}
      </Button>
    </form>
  );
}
