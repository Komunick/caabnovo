"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ExportCatalog, ExportFormat, ExportOperation, ExportRequest } from "@caab/contracts";
import { useDraftState } from "@/components/workspace-drafts";
import Link from "next/link";
import { ArrowUp, ArrowDown, Download, ArrowLeft } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { PermissionGate } from "@/components/workspace-permissions";
const terminal = new Set(["completed", "failed", "cancelled", "interrupted"]);
const messageFor = (code: string) =>
  code === "PERMISSION_DENIED"
    ? "Seu acesso mudou. Confira suas permissões antes de tentar novamente."
    : code === "UNAUTHENTICATED"
      ? "Sua sessão terminou. Entre novamente para exportar."
      : code === "EXPORT_CONFIGURATION_INVALID"
        ? "Confira os filtros e as colunas selecionadas."
        : "Não foi possível concluir a exportação. Seus filtros foram preservados; tente novamente.";
export function ExportScreen({
  catalog,
  sourcePermission,
  backHref,
}: {
  catalog: ExportCatalog;
  sourcePermission: string;
  backHref: string;
}) {
  const key = `export:${catalog.module}:${catalog.dataset}`;
  const [filters, setFilters] = useDraftState<Record<string, string>>(`${key}:filters`, {});
  const [columns, setColumns] = useDraftState(`${key}:columns`, () =>
    catalog.columns.filter((c) => c.defaultSelected).map((c) => c.key),
  );
  const [sort, setSort] = useDraftState(`${key}:sort`, "");
  const [direction, setDirection] = useDraftState<"asc" | "desc">(`${key}:direction`, "asc");
  const [format, setFormat] = useDraftState<ExportFormat>(`${key}:format`, "xlsx");
  const [error, setError] = useDraftState(`${key}:error`, "");
  const [operation, setOperation] = useState<ExportOperation | null>(null);
  const frame = useRef<HTMLIFrameElement>(null),
    requestId = useRef<HTMLInputElement>(null),
    configuration = useRef<HTMLInputElement>(null);
  const frameName = `export-${useId().replaceAll(":", "")}`;
  const active = operation !== null && !terminal.has(operation.phase);
  useEffect(() => {
    if (!operation?.requestId || !active) return;
    const id = operation.requestId,
      started = Date.now(),
      controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined,
      failures = 0,
      stopped = false;
    const fail = (text: string) => {
      stopped = true;
      setError(text);
      setOperation((p) => (p?.requestId === id ? { ...p, phase: "failed" } : p));
    };
    const listener = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.type !== "caab-export-error" ||
        event.data.requestId !== id
      )
        return;
      fail(messageFor(String(event.data.code)));
    };
    window.addEventListener("message", listener);
    const poll = async () => {
      try {
        const response = await fetch(`/api/v1/exports/operations/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (stopped) return;
        if (response.status === 401 || response.status === 403) {
          fail(messageFor(response.status === 401 ? "UNAUTHENTICATED" : "PERMISSION_DENIED"));
          return;
        }
        if (response.status === 404) {
          if (Date.now() - started > 15000) {
            fail(
              "O início do download não foi confirmado. Tente novamente; seus filtros foram preservados.",
            );
            return;
          }
        } else if (!response.ok) throw new Error("STATUS_UNAVAILABLE");
        else {
          const next = (await response.json()) as ExportOperation;
          if (next.requestId !== id) throw new Error("STATUS_INVALID");
          failures = 0;
          setOperation(next);
          if (terminal.has(next.phase)) {
            if (next.phase !== "completed") setError(messageFor(next.errorCode ?? "EXPORT_FAILED"));
            return;
          }
        }
      } catch {
        if (controller.signal.aborted) return;
        if (++failures >= 5) {
          fail(
            "Não foi possível acompanhar o download. Confira o navegador antes de tentar novamente.",
          );
          return;
        }
      }
      if (!stopped) timer = setTimeout(() => void poll(), 2000);
    };
    void poll();
    return () => {
      stopped = true;
      controller.abort();
      if (timer) clearTimeout(timer);
      window.removeEventListener("message", listener);
    };
  }, [operation?.requestId, active, setError]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (active || !columns.length) {
      event.preventDefault();
      setError("Selecione ao menos uma coluna.");
      return;
    }
    const selected = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const nextFormat = (selected?.value || format) as ExportFormat;
    const id = crypto.randomUUID();
    const config: ExportRequest = {
      module: catalog.module,
      dataset: catalog.dataset,
      filters,
      columns,
      sort: sort ? [{ field: sort, direction }] : [],
      format: nextFormat,
    };
    requestId.current!.value = id;
    configuration.current!.value = JSON.stringify(config);
    setFormat(nextFormat);
    setError("");
    setOperation({ requestId: id, phase: "preparing", rowCount: 0, byteCount: 0, errorCode: null });
  };
  const move = (index: number, offset: number) =>
    setColumns((previous) => {
      const next = [...previous],
        target = index + offset;
      if (target < 0 || target >= next.length) return previous;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  return (
    <PermissionGate permission={sourcePermission}>
      <PermissionGate permission="exports:generate">
        <div className="page-stack">
          <header className="page-header">
            <p className="eyebrow">{catalog.label}</p>
            <h1>Exportar {catalog.label.toLocaleLowerCase("pt-BR")}</h1>
            <p>Escolha os dados e baixe no formato desejado. Datas no horário da Bahia.</p>
            <Link href={backHref} className={buttonVariants({ size: "compact" })}>
              <ArrowLeft size={18} aria-hidden="true" /> Voltar à lista
            </Link>
          </header>
          <form
            className="panel export-form"
            action="/api/v1/exports/download"
            method="post"
            target={frameName}
            onSubmit={submit}
          >
            <input type="hidden" name="requestId" ref={requestId} />
            <input type="hidden" name="config" ref={configuration} />
            <input type="hidden" name="csrfToken" value={catalog.csrfToken} />
            <fieldset className="export-fields" disabled={active}>
              <legend>Filtros</legend>
              <div className="list-filters export-filters">
                {catalog.filters.map((filter) => (
                  <FormField
                    key={filter.key}
                    id={`export-filter-${filter.key}`}
                    label={filter.label}
                  >
                    {filter.type === "choice" ? (
                      <select
                        value={filters[filter.key] ?? (filter.key === "deleted" ? "excluded" : "")}
                        onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
                      >
                        {filter.key !== "deleted" && <option value="">Todos</option>}
                        {filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={filter.type === "date" ? "date" : "text"}
                        value={filters[filter.key] ?? ""}
                        onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
                      />
                    )}
                  </FormField>
                ))}
                <FormField id="export-sort" label="Ordenar por">
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="">Identificador</option>
                    {catalog.columns
                      .filter((c) => c.sortable)
                      .map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                  </select>
                </FormField>
                <FormField id="export-direction" label="Ordem">
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as "asc" | "desc")}
                  >
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </FormField>
              </div>
            </fieldset>
            <fieldset className="export-fields" disabled={active}>
              <legend>Colunas do arquivo</legend>
              <p className="export-hint">
                Marque as colunas e use as setas para ordenar. {columns.length} selecionadas.
              </p>
              <ol className="export-column-order" aria-label="Ordem das colunas">
                {[
                  ...columns,
                  ...catalog.columns
                    .filter((column) => !columns.includes(column.key))
                    .map((column) => column.key),
                ].map((key) => {
                  const column = catalog.columns.find((candidate) => candidate.key === key);
                  if (!column) return null;
                  const index = columns.indexOf(key);
                  const selected = index >= 0;
                  return (
                    <li key={key}>
                      <label className="access-option">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(event) =>
                            setColumns(
                              event.target.checked
                                ? [...columns, key]
                                : columns.filter((value) => value !== key),
                            )
                          }
                        />
                        <span>{column.label}</span>
                      </label>
                      {selected && (
                        <div className="button-row">
                          <span className="export-position" aria-hidden="true">
                            {index + 1}
                          </span>
                          <Button
                            size="compact"
                            disabled={index === 0}
                            aria-label={`Mover ${column.label} para cima`}
                            onClick={() => move(index, -1)}
                          >
                            <ArrowUp size={18} aria-hidden="true" />
                          </Button>
                          <Button
                            size="compact"
                            disabled={index === columns.length - 1}
                            aria-label={`Mover ${column.label} para baixo`}
                            onClick={() => move(index, 1)}
                          >
                            <ArrowDown size={18} aria-hidden="true" />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </fieldset>
            {error ? <p role="alert">{error}</p> : null}
            <div className="button-row">
              {(
                [
                  ["xlsx", "Excel"],
                  ["csv", "CSV"],
                  ["pdf", "PDF"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="submit"
                  value={value}
                  intent="primary"
                  size="compact"
                  disabled={active}
                >
                  <Download size={18} aria-hidden="true" /> Exportar em {label}
                </Button>
              ))}
            </div>
            <p role="status" aria-live="polite">
              {operation?.phase === "completed"
                ? `Geração e transferência concluídas pelo servidor: ${operation.rowCount} registros. Confira o arquivo nos downloads do navegador.`
                : active
                  ? "Preparando e transferindo o arquivo…"
                  : ""}
            </p>
          </form>
          <iframe ref={frame} name={frameName} title="Download da exportação" hidden />
        </div>
      </PermissionGate>
    </PermissionGate>
  );
}
