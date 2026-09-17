"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";

export function InitialPasswordReceipt({
  password,
  email,
  userId,
  onDone,
}: {
  password: string | null;
  email: string;
  userId: string;
  onDone?: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  return (
    <section className="panel page-stack" aria-labelledby="initial-password-title">
      <h2 id="initial-password-title">Senha inicial do colaborador</h2>
      <p>{email}</p>
      {password ? (
        <>
          <p>
            Copie a senha e entregue ao colaborador por um canal privado. Ela não poderá ser
            consultada novamente após fechar esta tela.
          </p>
          <FormField id="initial-password" label="Senha inicial">
            <PasswordInput id="initial-password" value={password} readOnly autoComplete="off" />
          </FormField>
          <Button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(password);
                setCopyStatus("Senha copiada.");
              } catch {
                setCopyStatus("Não foi possível copiar. Use Mostrar senha e copie pelo campo.");
              }
            }}
          >
            Copiar senha
          </Button>
          <p>O colaborador pode alterar a senha em Configurações após entrar.</p>
        </>
      ) : (
        <p>
          A conta já foi criada e a senha foi exibida na resposta original. Se você não a recebeu,
          use Esqueci minha senha no login para definir outra pelo e-mail do colaborador.
        </p>
      )}
      <p role="status">{copyStatus}</p>
      <Link
        href={`/users/${userId}`}
        className={buttonVariants({ intent: "primary" })}
        onClick={onDone}
      >
        Abrir colaborador
      </Link>
    </section>
  );
}

export function InitializePasswordForm({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [alreadyDefined, setAlreadyDefined] = useState(false);
  if (password)
    return (
      <InitialPasswordReceipt
        password={password}
        email={email}
        userId={userId}
        onDone={() => {
          setPassword(null);
          router.refresh();
        }}
      />
    );
  return (
    <section className="panel page-stack" aria-labelledby="missing-password-title">
      <h2 id="missing-password-title">Primeiro acesso</h2>
      <p>
        {alreadyDefined
          ? "A senha já foi definida. Para recuperar o acesso, use Esqueci minha senha no login."
          : "Este colaborador ainda não tem senha de acesso. Gere a senha inicial para entregar a ele."}
      </p>
      {error && <p role="alert">{error}</p>}
      {!alreadyDefined && (
        <Button
          intent="primary"
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError("");
            try {
              const response = await fetch(`/api/v1/users/${userId}/initial-password`, {
                method: "POST",
                headers: { "x-csrf-token": crypto.randomUUID() },
                cache: "no-store",
              });
              const data = await response.json();
              if (response.status === 409 && data.code === "PASSWORD_ALREADY_DEFINED") {
                setAlreadyDefined(true);
              } else if (!response.ok) {
                setError(
                  "Não foi possível gerar a senha. Confira suas permissões e atualize o cadastro.",
                );
              } else {
                setPassword(data.initialPassword);
              }
            } catch {
              setError(
                "Não foi possível confirmar a geração. Tente novamente; uma senha já definida será preservada.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Gerando…" : "Gerar senha inicial"}
        </Button>
      )}
    </section>
  );
}
