"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsRecord } from "../news-service";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { newsFieldErrors, focusNewsError, type NewsFieldErrors } from "./field-errors";

type PublicationState = {
  publication: { revision: number; channels: string[]; publishedAt: string } | null;
  actions: {
    id: string;
    revision: number;
    action: string;
    channels: string[];
    runAt: string;
    status: string;
    jobId: string;
    jobStatus: string;
    errorCode: string | null;
    attemptCount: number;
    attemptLimit: number;
  }[];
};
const failureMessage = (code: string | null) =>
  ({
    NEWS_NOT_READY: "Confira o conteúdo e a liberação das imagens da revisão agendada.",
    NEWS_SLUG_CONFLICT: "O endereço já está publicado em outra notícia.",
    NEWS_ACTION_CONFLICT: "Confira o horário e se o responsável pelo agendamento continua ativo.",
    NEWS_NOT_FOUND: "A revisão agendada não está disponível.",
  })[code ?? ("" as never)] ??
  "Não foi possível concluir. Tente novamente após verificar o processamento.";
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
export function NewsPublishing({
  record,
  dirty,
  disabled,
  onSaved,
  onBusyChange,
  onFieldErrors,
}: Readonly<{
  record: NewsRecord;
  dirty: boolean;
  disabled: boolean;
  onSaved(record: NewsRecord): void;
  onBusyChange(busy: boolean): void;
  onFieldErrors(errors: NewsFieldErrors): void;
}>) {
  const [state, setState] = useState<PublicationState>({ publication: null, actions: [] });
  const [channels, setChannels] = useState<string[]>(record.metadata.channels);
  const [runAt, setRunAt] = useState("");
  const [scheduleAction, setScheduleAction] = useState("publish");
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | "schedule">();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<NewsFieldErrors>({});
  const [message, setMessage] = useState("");
  const retry = useRef<{ fingerprint: string; key: string } | undefined>(undefined);
  const busy = useRef(false);
  const reload = useCallback(async () => {
    const response = await fetch(`/api/v1/news/${record.id}/publication`, { cache: "no-store" });
    if (!response.ok) throw new Error("Não foi possível consultar a publicação.");
    setState((await response.json()) as PublicationState);
  }, [record.id]);
  useEffect(() => {
    void reload().catch((error: Error) => setError(error.message));
  }, [reload, record.revision]);
  const hasPending = state.actions.some((action) => action.status === "pending");
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => {
      void reload().catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [hasPending, reload]);
  async function command(
    action: "publish" | "unpublish" | "schedule" | "cancel" | "retry",
    actionId?: string,
  ) {
    if (busy.current) return;
    setError("");
    setMessage("");
    setFieldErrors({});
    let input: Record<string, unknown> = { expectedVersion: record.revision, channels };
    if (action === "schedule") {
      // The form explicitly uses Brasília time; the current supported window is the next year.
      const parsed = new Date(`${runAt}:00-03:00`);
      if (
        !runAt ||
        !Number.isFinite(parsed.getTime()) ||
        parsed.getTime() <= Date.now() ||
        parsed.getTime() > Date.now() + 365 * 86400000
      ) {
        setFieldErrors(newsFieldErrors([{ path: "runAt" }]));
        setError("Confira a data e o horário indicados abaixo.");
        setConfirm(undefined);
        focusNewsError();
        return;
      }
      input = {
        ...input,
        action: scheduleAction,
        runAt: parsed.toISOString(),
        timezone: "America/Sao_Paulo",
      };
    }
    const body = JSON.stringify(input),
      fingerprint = `${action}:${actionId ?? ""}:${body}`;
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, key: crypto.randomUUID() };
    busy.current = true;
    setPending(true);
    onBusyChange(true);
    try {
      const response = await fetch(
        `/api/v1/news/${record.id}/${action === "cancel" || action === "retry" ? `actions/${actionId}/${action}` : action}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": crypto.randomUUID(),
            "idempotency-key": retry.current.key,
          },
          body,
        },
      );
      if (!response.ok) {
        const data = (await response.json()) as {
          code?: string;
          fields?: { path: string; code: string }[];
        };
        const fields = newsFieldErrors(
          data.fields ??
            (data.code === "NEWS_SLUG_CONFLICT" ? [{ path: "slug", code: data.code }] : []),
        );
        if (Object.keys(fields).length) {
          setFieldErrors(fields);
          onFieldErrors(fields);
          setConfirm(undefined);
        }
        throw new Error(
          data.code === "NEWS_SLUG_CONFLICT"
            ? "Esse endereço já está publicado em outra notícia."
            : response.status === 409
              ? "A notícia ou o agendamento mudou. Reabra o editor para conferir a versão atual."
              : response.status === 422
                ? "Confira título, endereço, conteúdo, descrição e liberação das imagens, destinos e horário."
                : "Não foi possível concluir a ação. Tente novamente.",
        );
      }
      if (action === "publish" || action === "unpublish")
        onSaved((await response.json()) as NewsRecord);
      retry.current = undefined;
      setConfirm(undefined);
      await reload();
      setMessage(
        action === "publish"
          ? "Notícia publicada nos destinos escolhidos."
          : action === "unpublish"
            ? "Publicação retirada dos destinos escolhidos."
            : action === "schedule"
              ? "Agendamento salvo para a revisão indicada."
              : action === "retry"
                ? "Nova tentativa solicitada."
                : "Agendamento cancelado.",
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Falha de conexão.");
    } finally {
      busy.current = false;
      setPending(false);
      onBusyChange(false);
      focusNewsError();
    }
  }
  return (
    <section className="panel" aria-labelledby="news-publication-title">
      <h2 id="news-publication-title">Publicação e agenda</h2>
      {state.publication ? (
        <p>
          Publicada · revisão {state.publication.revision} · {date(state.publication.publishedAt)}{" "}
          (Brasília). Destinos:{" "}
          {state.publication.channels
            .map((channel) => (channel === "app" ? "Aplicativo" : "Site"))
            .join(", ")}
          .
        </p>
      ) : (
        <p>Esta notícia ainda não está publicada.</p>
      )}
      <p>
        As notícias publicadas podem ser lidas sem login. Rascunhos e histórico continuam privados.
      </p>
      {state.publication ? (
        <div className="news-actions">
          {state.publication.channels.map((channel) => (
            <a
              key={channel}
              href={`/content/${channel}/news/${record.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Consultar publicação: {channel === "app" ? "Aplicativo" : "Site"}
            </a>
          ))}
        </div>
      ) : null}
      <p>
        Disponibilidade para leitura: Site{" "}
        {state.publication?.channels.includes("site") ? "disponível" : "não publicado"}; Aplicativo{" "}
        {state.publication?.channels.includes("app") ? "disponível" : "não publicado"}. A consulta
        pelo aplicativo depende da integração dele.
      </p>
      <fieldset
        disabled={disabled || pending || record.archived}
        className="news-fields"
        aria-invalid={!!fieldErrors.channels}
        aria-describedby={fieldErrors.channels ? "news-action-channels-error" : undefined}
      >
        <legend>Destinos da ação</legend>
        {(["site", "app"] as const).map((channel) => (
          <label key={channel} className="checkbox-field">
            <input
              type="checkbox"
              checked={channels.includes(channel)}
              onChange={(event) => {
                setFieldErrors((old) => ({ ...old, channels: undefined }));
                setChannels(
                  event.target.checked
                    ? [...channels, channel]
                    : channels.filter((value) => value !== channel),
                );
              }}
            />
            {channel === "app" ? "Aplicativo" : "Site"}
          </label>
        ))}
        {fieldErrors.channels ? (
          <p id="news-action-channels-error" className="field-error" role="alert">
            {fieldErrors.channels}
          </p>
        ) : null}
        {dirty ? <p>Salve as alterações antes de publicar ou agendar.</p> : null}
        <div className="news-actions">
          <Button
            intent="primary"
            disabled={dirty || !channels.length}
            onClick={() => setConfirm("publish")}
          >
            Publicar agora
          </Button>
          <Button
            disabled={dirty || !channels.length || !state.publication}
            onClick={() => setConfirm("unpublish")}
          >
            Retirar publicação
          </Button>
        </div>
        <FormField id="news-schedule-action" label="Ação agendada">
          <select
            value={scheduleAction}
            onChange={(event) => setScheduleAction(event.target.value)}
          >
            <option value="publish">Publicar a revisão {record.revision}</option>
            <option value="unpublish">Retirar a publicação atual</option>
          </select>
        </FormField>
        <FormField
          id="news-run-at"
          error={fieldErrors.runAt}
          label="Data e horário de Brasília"
          hint="Horário de Brasília (UTC−03:00), nos próximos 12 meses."
        >
          <input
            type="datetime-local"
            value={runAt}
            onChange={(event) => {
              setRunAt(event.target.value);
              setFieldErrors((old) => ({ ...old, runAt: undefined }));
            }}
          />
        </FormField>
        <p>
          Uma edição posterior não altera a revisão agendada. Se houver nova publicação, a retirada
          antiga será cancelada.
        </p>
        <Button
          disabled={dirty || !channels.length || !runAt}
          onClick={() => setConfirm("schedule")}
        >
          Agendar
        </Button>
      </fieldset>
      {message ? <p role="status">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <h3>Agendamentos recentes</h3>
      {!state.actions.length ? (
        <p>Nenhum agendamento.</p>
      ) : (
        <ul className="news-history">
          {state.actions.map((action) => (
            <li key={action.id}>
              <strong>
                {action.action === "publish" ? "Publicar" : "Retirar"} · revisão {action.revision}
              </strong>
              <p>
                {date(action.runAt)} (Brasília) ·{" "}
                {action.channels
                  .map((channel) => (channel === "app" ? "Aplicativo" : "Site"))
                  .join(", ")}{" "}
                ·{" "}
                {action.status === "pending"
                  ? action.jobStatus === "failed"
                    ? "Falhou"
                    : action.jobStatus === "running"
                      ? "Em execução"
                      : "Agendado"
                  : action.status === "succeeded"
                    ? "Concluído"
                    : "Cancelado"}
              </p>
              {action.status === "pending" && action.jobStatus === "failed" ? (
                <p>
                  {failureMessage(action.errorCode)}{" "}
                  {action.attemptCount >= action.attemptLimit
                    ? "Limite de tentativas atingido. Cancele e crie um novo agendamento."
                    : "A revisão original será mantida ao tentar novamente."}
                </p>
              ) : null}
              <div className="news-actions">
                {action.status === "pending" ? (
                  <>
                    <Button
                      disabled={disabled || pending}
                      onClick={() => void command("cancel", action.id)}
                    >
                      Cancelar agendamento
                    </Button>
                    {action.jobStatus === "failed" && action.attemptCount < action.attemptLimit ? (
                      <Button
                        disabled={disabled || pending}
                        onClick={() => void command("retry", action.id)}
                      >
                        Tentar novamente
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirm(undefined);
        }}
      >
        <DialogContent
          title={
            confirm === "schedule"
              ? "Confirmar agendamento"
              : confirm === "unpublish"
                ? "Retirar publicação"
                : "Publicar notícia"
          }
          description={
            confirm === "unpublish" || (confirm === "schedule" && scheduleAction === "unpublish")
              ? `A publicação deixará de aparecer nos destinos escolhidos${confirm === "schedule" ? " no horário informado" : ""}; o histórico será preservado.`
              : `A revisão ${record.revision} será disponibilizada para leitura pública nos destinos escolhidos${confirm === "schedule" ? " no horário informado" : ""}.`
          }
        >
          {error ? <p role="alert">{error}</p> : null}
          <div className="news-actions">
            <Button disabled={pending} onClick={() => setConfirm(undefined)}>
              Voltar
            </Button>
            <Button
              intent="primary"
              disabled={pending}
              onClick={() => confirm && void command(confirm)}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
