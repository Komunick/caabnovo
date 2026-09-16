"use client";
import { useEffect, useRef, useState } from "react";
const errors: Record<string, string> = {
  VERSION_CONFLICT:
    "Este registro mudou. Suas edições foram preservadas. Confira a versão atual antes de salvar novamente.",
  MESSAGE_LOCKED: "Cancele a programação ou restaure o registro antes de editar.",
  CONTENT_INCOMPLETE: "Confira o assunto, a mensagem e as variáveis de personalização.",
  INVALID_SCHEDULE: "Programe com pelo menos um minuto de antecedência e até um ano.",
  PERMISSION_DENIED: "Você não tem mais acesso a mensagens.",
  AUTHENTICATION_REQUIRED: "Sua sessão terminou. Entre novamente para continuar.",
  INVALID_STATE: "A situação mudou. Atualize o registro e confira a operação.",
  INVALID_RECIPIENT: "Um destinatário não está disponível. Confira o público.",
  BODY_TOO_LARGE:
    "A seleção ficou muito grande para uma única gravação. Use os filtros de público para incluir toda a base.",
  VALIDATION_FAILED: "Confira os campos obrigatórios e os limites de texto.",
  IDEMPOTENCY_CONFLICT:
    "Essa solicitação já foi usada com outros dados. Atualize e tente novamente.",
};
export async function messageRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  let data;
  try {
    response = await fetch(`/api/v1/messages/${path}`, { ...options, cache: "no-store" });
    data = await response.json();
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error("Falha de conexão. Suas edições foram preservadas. Tente novamente.");
  }
  if (!response.ok)
    throw new Error(
      errors[data.error?.code ?? data.code] ??
        "Não foi possível concluir a operação. Tente novamente.",
    );
  return data as T;
}
export function useMessageData<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data?: T; error?: string }>({
    path: null,
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setState({ path });
    void messageRequest<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ path, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ path, error: String(error.message) });
      });
    return () => controller.abort();
  }, [path, revision]);
  return {
    data: state.path === path ? state.data : undefined,
    error: state.path === path ? state.error : undefined,
    reload: () => setRevision((n) => n + 1),
  };
}
export function useMessageMutation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);
  const retry = useRef({ payload: "", key: "" });
  async function mutate<T>(path: string, method: string, input: unknown): Promise<T | undefined> {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError("");
    const body = JSON.stringify(input),
      payload = `${method}:${path}:${body}`;
    if (retry.current.payload !== payload) retry.current = { payload, key: crypto.randomUUID() };
    try {
      const data = await messageRequest<T>(path, {
        method,
        body,
        headers: {
          "content-type": "application/json",
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": retry.current.key,
        },
      });
      retry.current = { payload: "", key: "" };
      return data;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      running.current = false;
      setPending(false);
    }
  }
  return { pending, error, mutate };
}
