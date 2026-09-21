"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ExportCatalog, ExportFormat, ExportOperation, ExportRequest } from "@caab/contracts";
import { useDraftState } from "@/components/workspace-drafts";
import { Button } from "@/components/ui/button";
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
}: {
  catalog: ExportCatalog;
  sourcePermission: string;
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
          <header>
            <p className="eyebrow">{catalog.label}</p>
            <h1>Exportar {catalog.label.toLocaleLowerCase("pt-BR")}</h1>
            <p>Escolha os filtros, as colunas e o formato. Datas no horário da Bahia.</p>
          </header>
          <form
            className="panel page-stack"
            action="/api/v1/exports/download"
            method="post"
            target={frameName}
            onSubmit={submit}
          >
            <input type="hidden" name="requestId" ref={requestId} />
            <input type="hidden" name="config" ref={configuration} />
            <input type="hidden" name="csrfToken" value={catalog.csrfToken} />
            <fieldset disabled={active}>
              <legend>Filtros</legend>
              <div className="form-grid">
                {catalog.filters.map((filter) => (
                  <label key={filter.key}>
                    {filter.label}
                    {filter.type === "choice" ? (
                      <select
                        value={filters[filter.key] ?? ""}
                        onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
                      >
                        <option value="">
                          {filter.key === "deleted" ? "Cadastros atuais" : "Todos"}
                        </option>
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
                  </label>
                ))}
                <label>
                  Ordenar por
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
                </label>
                <label>
                  Ordem
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as "asc" | "desc")}
                  >
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </label>
              </div>
            </fieldset>
            <fieldset disabled={active}>
              <legend>Colunas</legend>
              <div className="button-row">
                {catalog.columns.map((column) => (
                  <label key={column.key}>
                    <input
                      type="checkbox"
                      checked={columns.includes(column.key)}
                      onChange={(e) =>
                        setColumns(
                          e.target.checked
                            ? [...columns, column.key]
                            : columns.filter((key) => key !== column.key),
                        )
                      }
                    />
                    {column.label}
                  </label>
                ))}
              </div>
              <ol aria-label="Ordem das colunas">
                {columns.map((key, index) => {
                  const label =
                    catalog.columns.find((c) => c.key === key)?.label ?? "Coluna indisponível";
                  return (
                    <li key={key}>
                      <span>{label} </span>
                      <Button
                        size="compact"
                        disabled={index === 0}
                        aria-label={`Mover ${label} para cima`}
                        onClick={() => move(index, -1)}
                      >
                        Subir
                      </Button>
                      <Button
                        size="compact"
                        disabled={index === columns.length - 1}
                        aria-label={`Mover ${label} para baixo`}
                        onClick={() => move(index, 1)}
                      >
                        Descer
                      </Button>
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
                  intent={format === value ? "primary" : "secondary"}
                  disabled={active}
                >
                  Exportar em {label}
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
