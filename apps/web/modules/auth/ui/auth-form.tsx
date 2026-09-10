"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

export function AuthForm() {
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
    const endpoint = "/api/auth/sign-in/email";
    const body = { email: data.get("email"), password: data.get("password") };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError("Credenciais inválidas.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form method="post" onSubmit={submit} noValidate>
      <FormField id="email" label="E-mail">
        <Input name="email" type="email" autoComplete="username" required />
      </FormField>
      <FormField id="password" label="Senha">
        <PasswordInput name="password" autoComplete="current-password" required />
      </FormField>
      <Link href="/forgot-password">Esqueci minha senha</Link>
      {error ? <Alert>{error}</Alert> : null}
      <Button intent="primary" type="submit" disabled={pending || !hydrated}>
        {pending || !hydrated ? (
          <>
            <Spinner label="Autenticando" /> Aguarde…
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
