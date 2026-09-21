"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SensitiveActionDialog } from "./sensitive-action-dialog";
import { PasswordInput } from "@/components/ui/password-input";

export function InitialPasswordReceipt({
  password,
  email,
  userId,
  onDone,
  replacement = false,
}: {
  password: string | null;
  email: string;
  userId: string;
  onDone?: () => void;
  replacement?: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  return (
    <section className="panel page-stack" aria-labelledby="initial-password-title">
      <h2 id="initial-password-title">
        {replacement ? "Nova senha do colaborador" : "Senha inicial do colaborador"}
      </h2>
      <p>{email}</p>
      {password ? (
        <>
          <p>
            Copie a senha e entregue ao colaborador por um canal privado. Ela não poderá ser
            consultada novamente após fechar esta tela.
          </p>
          <FormField id="initial-password" label={replacement ? "Nova senha" : "Senha inicial"}>
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

export function ResetPasswordForm({
  userId,
  email,
  version,
}: {
  userId: string;
  email: string;
  version: number;
}) {
  const router = useRouter();
  // A credential receipt only lives in this mounted component, never in drafts/storage.
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState("");
  if (password)
    return (
      <InitialPasswordReceipt
        password={password}
        email={email}
        userId={userId}
        replacement
        onDone={() => {
          setPassword(null);
          router.refresh();
        }}
      />
    );
  return (
    <section className="panel page-stack" aria-labelledby="reset-password-title">
      <h2 id="reset-password-title">Senha de acesso</h2>
      <p>Gere uma nova senha para entregar ao colaborador por um canal privado.</p>
      {error && <p role="alert">{error}</p>}
      <SensitiveActionDialog
        triggerLabel="Gerar nova senha"
        title="Gerar nova senha do colaborador"
        confirmLabel="Confirmar nova senha"
        description="A senha anterior deixará de funcionar e as sessões deste colaborador serão encerradas. A nova senha será exibida uma única vez."
        onConfirm={async () => {
          setError("");
          try {
            const response = await fetch(`/api/v1/users/${userId}/reset-password`, {
              method: "POST",
              headers: { "content-type": "application/json", "x-csrf-token": crypto.randomUUID() },
              body: JSON.stringify({ version }),
              cache: "no-store",
            });
            const result = await response.json();
            if (!response.ok) {
              setError(
                response.status === 409
                  ? "O cadastro foi alterado. Atualize a página antes de gerar outra senha."
                  : "Não foi possível gerar a senha. Confira suas permissões e a situação do colaborador.",
              );
              throw new Error("Password replacement refused");
            }
            setPassword(result.initialPassword);
          } catch (error) {
            setError(
              (current) =>
                current ||
                "Não foi possível confirmar a geração. Atualize o cadastro antes de tentar novamente.",
            );
            throw error;
          }
        }}
      />
    </section>
  );
}
