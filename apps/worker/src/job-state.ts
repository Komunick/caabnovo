export type JobState = "queued" | "running" | "succeeded" | "failed";
export type JobEvent = "start" | "retry" | "succeed" | "fail" | "redrive";

const transitions: Record<JobState, Partial<Record<JobEvent, JobState>>> = {
  queued: { start: "running" },
  running: { retry: "queued", succeed: "succeeded", fail: "failed" },
  succeeded: {},
  failed: { redrive: "queued" },
};

export function nextJobState(state: JobState, event: JobEvent): JobState {
  const next = transitions[state][event];
  if (!next) throw new Error(`Invalid job transition: ${state} -> ${event}`);
  return next;
}

export function safeJobFailure(error: unknown): { code: string; message: string } {
  const code =
    typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    NEWS_NOT_READY: "Confira o conteúdo e a liberação das imagens da revisão agendada.",
    NEWS_SLUG_CONFLICT: "O endereço da notícia já está publicado em outro cadastro.",
    NEWS_ACTION_CONFLICT: "Confira o horário e se o responsável pelo agendamento continua ativo.",
    NEWS_NOT_FOUND: "A notícia ou a revisão agendada não está disponível.",
    NEWS_ARCHIVED: "A notícia foi arquivada.",
  };
  if (messages[code]) return { code, message: messages[code] };
  return { code: "JOB_FAILED", message: "The operation could not be completed" };
}
