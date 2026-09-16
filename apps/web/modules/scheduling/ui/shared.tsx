"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { schedulingKinds, type SchedulingPage, type SchedulingKind } from "@caab/contracts";
import { Button, buttonVariants } from "@/components/ui/button";
import { ModuleNavigation } from "@/components/ui/module-navigation";
import { FormField } from "@/components/ui/form-field";
import { catalogLabels } from "./catalog-labels";

const messages: Record<string, string> = {
  SCHEDULING_CONFLICT: "Essa vaga não está mais disponível. Escolha outro horário.",
  SCHEDULING_VERSION_CONFLICT:
    "O registro foi alterado. Recarregue a página e confira os dados antes de salvar.",
  SCHEDULING_FUTURE_BOOKINGS:
    "A alteração afetaria reservas futuras. Remarque ou cancele essas reservas antes de alterar a configuração.",
  SCHEDULING_BENEFICIARY_BLOCKED:
    "O cadastro está arquivado ou o beneficiário ou seu titular está bloqueado. Confira o cadastro antes de reservar.",
  SCHEDULING_BENEFICIARY_ARCHIVED: "O cadastro está arquivado. Confira o beneficiário.",
  SCHEDULING_PAST: "Escolha um horário futuro. Reservas passadas não podem ser alteradas.",
  SCHEDULING_OFFER_UNAVAILABLE: "A oferta está inativa. Selecione outra opção.",
  SCHEDULING_DUPLICATE: "Esse vínculo já existe. Localize-o na lista para editar.",
  HOURS_OUTSIDE_UNIT:
    "O expediente do profissional deve estar dentro do horário da unidade. Ajuste primeiro o profissional para reduzir o horário da unidade.",
  SCHEDULING_PARENT_IMMUTABLE: "Para mudar a unidade ou o vínculo, cadastre uma nova oferta.",
  VALIDATION_FAILED: "Confira os campos: nomes, duração, horários e endereço devem ser válidos.",
  AUTHENTICATION_REQUIRED: "Sua sessão terminou. Entre novamente para continuar.",
};
export async function schedulingRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  let data;
  try {
    response = await fetch(`/api/v1/scheduling/${path}`, { ...options, cache: "no-store" });
    data = await response.json();
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error("Não foi possível conectar ao serviço. Confira sua conexão e tente novamente.");
  }
  if (!response.ok)
    throw new Error(
      messages[data.error?.code ?? data.code] ??
        (response.status === 422
          ? "Confira os campos e selecione uma oferta e um horário válidos."
          : "Não foi possível concluir. Atualize os dados e tente novamente."),
    );
  return data as T;
}
export function useSchedulingData<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data?: T; error?: string }>({
    path: null,
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    setState({ path });
    void schedulingRequest<T>(path, { signal: controller.signal })
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
    reload: () => setRevision((value) => value + 1),
  };
}
export function useSchedulingMutation() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const retry = useRef({ payload: "", key: "" });
  const running = useRef(false);
  async function mutate<T>(path: string, method: string, input: unknown): Promise<T | undefined> {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError("");
    const body = JSON.stringify(input);
    const payload = `${method}:${path}:${body}`;
    if (retry.current.payload !== payload) retry.current = { payload, key: crypto.randomUUID() };
    try {
      const result = await schedulingRequest<T>(path, {
        method,
        body,
        headers: {
          "content-type": "application/json",
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": retry.current.key,
        },
      });
      retry.current = { payload: "", key: "" };
      return result;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      running.current = false;
      setPending(false);
    }
  }
  return { pending, error, mutate };
}
export function SchedulingShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const query = useSearchParams();
  const selectedKind = query.get("kind") as SchedulingKind;
  const kind = schedulingKinds.includes(selectedKind) ? selectedKind : "units";
  return (
    <div className="page-stack scheduling-workspace">
      <header className="page-header">
        <p className="eyebrow">Agendamentos</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {action ??
          (pathname !== "/scheduling/new" && (
            <Link
              href="/scheduling/new"
              className={buttonVariants({ intent: "primary", size: "add" })}
            >
              <Plus aria-hidden="true" /> Nova reserva
            </Link>
          ))}
      </header>
      <ModuleNavigation
        label="Agendamentos"
        items={[
          {
            href: "/scheduling",
            label: "Agenda diária",
            active: !pathname.includes("/catalog") && !pathname.includes("/hours"),
          },
          ...schedulingKinds.map((item) => ({
            href: `/scheduling/catalog?kind=${item}`,
            label: catalogLabels[item].title,
            active: pathname === "/scheduling/catalog" && kind === item,
          })),
          {
            href: "/scheduling/hours",
            label: "Horários",
            active: pathname === "/scheduling/hours",
          },
        ]}
      />
      {children}
    </div>
  );
}
export function DataState({ error, reload }: { error?: string; reload(): void }) {
  return error ? (
    <div role="alert">
      <p>{error}</p>
      <Button onClick={reload}>Tentar novamente</Button>
    </div>
  ) : (
    <p role="status">Carregando…</p>
  );
}
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage(page: number): void;
}) {
  return (
    <nav className="pagination scheduling-pagination" aria-label="Paginação de registros">
      <span role="status">
        {total} registro(s) · Página {page} de {Math.max(1, Math.ceil(total / pageSize))}
      </span>
      <Button disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft aria-hidden="true" size={18} /> Anterior
      </Button>
      <Button disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>
        Próxima <ChevronRight aria-hidden="true" size={18} />
      </Button>
    </nav>
  );
}
export function Choice({
  label,
  resource,
  filters = "",
  value,
  onChange,
  required = false,
  disabled = false,
  selectedLabel,
}: {
  label: string;
  resource: string;
  filters?: string;
  value: string;
  onChange(value: string): void;
  required?: boolean;
  disabled?: boolean;
  selectedLabel?: string;
}) {
  const id = useId();
  const [selectionLabel, setSelectionLabel] = useState(selectedLabel);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const result = useSchedulingData<
    SchedulingPage<{
      id: string;
      name: string;
      birthYear?: number | null;
      oabNumber?: string | null;
      oabState?: string | null;
    }>
  >(disabled ? null : `${resource}?page=${page}&q=${encodeURIComponent(q)}&${filters}`);
  return (
    <fieldset className="scheduling-choice" disabled={disabled}>
      <legend>{label}</legend>
      <FormField
        id={`${id}-search`}
        label={`Buscar ${label.toLocaleLowerCase("pt-BR")}`}
        className="scheduling-choice-search"
      >
        <input
          type="search"
          placeholder="Digite para filtrar as opções"
          maxLength={160}
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
      </FormField>
      <FormField id={id} label={`Selecionar ${label.toLocaleLowerCase("pt-BR")}`}>
        <select
          required={required}
          value={value}
          onChange={(event) => {
            setSelectionLabel(event.target.selectedOptions[0]?.textContent ?? undefined);
            onChange(event.target.value);
          }}
        >
          <option value="">Selecione</option>
          {value && !result.data?.items.some((item) => item.id === value) && (
            <option value={value}>{selectionLabel ?? "Seleção atual"}</option>
          )}
          {result.data?.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {resource === "beneficiaries"
                ? ` · ${item.birthYear ?? "ano não informado"}${item.oabNumber ? ` · OAB ${item.oabState ?? ""} ${item.oabNumber}` : ""} · ${item.id.slice(0, 8)}`
                : ""}
            </option>
          ))}
        </select>
      </FormField>
      {resource === "beneficiaries" && value && selectionLabel && (
        <p>Selecionado: {selectionLabel}</p>
      )}
      {!disabled &&
        (result.data ? (
          <>
            {(result.data.total > result.data.pageSize || page > 1) && (
              <Pagination {...result.data} onPage={setPage} />
            )}
            {!result.data.total && <p>Nenhum registro encontrado.</p>}
          </>
        ) : (
          <DataState error={result.error} reload={result.reload} />
        ))}
    </fieldset>
  );
}
export function timeLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
export function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
