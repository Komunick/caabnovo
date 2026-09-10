"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { saveSettings } from "./account-settings-form";

export function ConfirmEmail() {
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const captured = useRef(false);
  useEffect(() => {
    if (captured.current) return;
    captured.current = true;
    setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function confirm() {
    setPending(true);
    setError("");
    try {
      await saveSettings({ action: "confirm-email", token });
      setToken("");
      setDone(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível confirmar o e-mail.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="panel page-stack">
      {done ? (
        <p role="status">
          E-mail alterado com sucesso. Use o novo endereço no próximo login. As outras sessões foram
          encerradas.
        </p>
      ) : (
        <>
          <p>
            Para concluir, você precisa estar conectado à conta que solicitou a troca. Caso ainda
            não esteja, <Link href="/login">entre com seu e-mail atual</Link> e abra novamente o
            link recebido.
          </p>
          <button
            className="primary-button compact-button"
            type="button"
            disabled={!token || pending}
            onClick={confirm}
          >
            {pending ? "Confirmando…" : "Confirmar troca de e-mail"}
          </button>
          {!token ? (
            <p>
              Abra o link completo recebido no e-mail. Se ele expirou, solicite outro em
              Configurações.
            </p>
          ) : null}
        </>
      )}
      {error ? <p role="alert">{error}</p> : null}
      <Link href="/settings">Voltar às configurações</Link>
    </section>
  );
}
