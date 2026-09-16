"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { MessageKind, MessageList } from "@caab/contracts";
import { Button, buttonVariants } from "@/components/ui/button";
import { ModuleNavigation } from "@/components/ui/module-navigation";
import styles from "./messages.module.css";
export const labels = {
  campaigns: { title: "Campanhas", singular: "campanha", add: "Nova campanha" },
  templates: { title: "Modelos", singular: "modelo", add: "Novo modelo" },
  audiences: { title: "Públicos", singular: "público", add: "Novo público" },
};
export const listPath = (kind: MessageKind) =>
  kind === "campaigns" ? "/messages" : `/messages/${kind}`;
export function MessageShell({
  active,
  title,
  description,
  children,
  add = false,
}: {
  active: MessageKind | "preferences" | "channels" | "schedules";
  title: string;
  description: string;
  children: ReactNode;
  add?: boolean;
}) {
  return (
    <div className={`page-stack ${styles.root}`}>
      <header className="page-header">
        <p className="eyebrow">Mensagens</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {add && active !== "preferences" && active !== "channels" && active !== "schedules" && (
          <Link
            href={`/messages/${active}/new`}
            className={buttonVariants({ intent: "primary", size: "add" })}
          >
            <Plus aria-hidden="true" />
            {labels[active].add}
          </Link>
        )}
      </header>
      <ModuleNavigation
        label="Áreas de mensagens"
        items={[
          ...(["campaigns", "templates", "audiences"] as const).map((kind) => ({
            href: listPath(kind),
            label: labels[kind].title,
            active: active === kind,
          })),
          { href: "/messages/schedules", label: "Agendamentos", active: active === "schedules" },
          {
            href: "/messages/preferences",
            label: "Preferências",
            active: active === "preferences",
          },
          { href: "/messages/channels", label: "Meios de envio", active: active === "channels" },
        ]}
      />
      {children}
    </div>
  );
}
export function MessageDataState({ error, reload }: { error?: string; reload(): void }) {
  return error ? (
    <div role="alert">
      <p>{error}</p>
      <Button onClick={reload}>Tentar novamente</Button>
    </div>
  ) : (
    <p role="status">Carregando…</p>
  );
}
export function MessagePagination({
  result,
  onPage,
}: {
  result: MessageList<unknown>;
  onPage(page: number): void;
}) {
  return (
    <nav className={styles.actions} aria-label="Paginação">
      <span role="status">
        {result.total} registro(s) · Página {result.page}
      </span>
      <Button disabled={result.page === 1} onClick={() => onPage(result.page - 1)}>
        Anterior
      </Button>
      <Button disabled={!result.hasNextPage} onClick={() => onPage(result.page + 1)}>
        Próxima
      </Button>
    </nav>
  );
}
export function messageDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Bahia",
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}
export const executionReasons: Record<string, string> = {
  NO_CHANNEL: "Meio de envio não configurado",
  NO_RECIPIENTS: "Nenhum destinatário elegível",
  ACCESS_REVOKED: "Acesso do solicitante removido",
  RESCHEDULED: "Substituída por novo agendamento",
  USER_CANCELED: "Cancelada pelo painel",
};
