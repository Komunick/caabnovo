"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, Plus, Presentation, X } from "lucide-react";
import {
  reportCatalog,
  reportChange,
  reportPreset,
  reportQuerySchema,
  type ReportDataset,
  type ReportQuery,
  type ReportSummary,
  type ReportTable,
  type ReportUsage,
} from "@caab/contracts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableContainer } from "@/components/ui/table";
import { useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { reportRequest } from "./client";
import styles from "./reports.module.css";
type Saved = {
  id: string;
  name: string;
  version: number;
  configuration: { query: ReportQuery; notes: string };
};
type Export = {
  id: string;
  status: string;
  progress: number;
  created_at: string;
  configuration: { query: ReportQuery; format: string };
  safe_error_code: string | null;
};
type Data = {
  summary: ReportSummary;
  table: ReportTable | null;
  usage: ReportUsage;
  catalog: { key: ReportDataset; label: string }[];
  canExport: boolean;
};
const views = {
  summary: "Resumo gerencial",
  details: "Análise detalhada",
  executive: "Resultados e evolução",
} as const;
const number = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
const channelLabel = {
  all: "Todos os canais",
  admin: "Painel administrativo",
  site: "Sites",
  app: "Aplicativo",
};
export function ReportsPage({
  environment,
  datasets,
}: {
  environment: ReportQuery["environment"];
  datasets: ReportDataset[];
}) {
  const cache = useDraftCache();
  const [selected, setSelected] = useDraftState<Saved | null>("reports:selection", null);
  const prefix = `reports:${selected?.id ?? "new"}:`;
  const defaultQuery = reportQuerySchema.parse({
    ...reportPreset("month"),
    environment,
    dataset: datasets[0] ?? "bookings",
  });
  const initial = selected?.configuration.query ?? defaultQuery;
  const [filters, setFilters] = useDraftState<ReportQuery>(`${prefix}filters`, initial);
  const [query, setQuery] = useDraftState<ReportQuery>(`${prefix}applied`, initial);
  const [name, setName] = useDraftState(`${prefix}name`, selected?.name ?? "");
  const [notes, setNotes] = useDraftState(`${prefix}notes`, selected?.configuration.notes ?? "");
  const [error, setError] = useDraftState(`${prefix}error`, "");
  const [baselineVersion, setBaselineVersion] = useDraftState(
    `${prefix}version`,
    selected?.version,
  );
  const [state, setState] = useState<{ key: string; data?: Data; error?: string }>({ key: "" });
  const [saved, setSaved] = useState<Saved[]>([]),
    [exports, setExports] = useState<Export[]>([]);
  const [revision, setRevision] = useState(0),
    [exportPage, setExportPage] = useState(1),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const [presentation, setPresentation] = useState(false);
  const [listError, setListError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const running = useRef(false),
    retry = useRef({ payload: "", key: "" });
  const key = JSON.stringify(query);
  const data = state.key === key ? state.data : undefined;
  useEffect(() => {
    const abort = new AbortController();
    void reportRequest<Data>(`?q=${encodeURIComponent(key)}`, { signal: abort.signal })
      .then((data) => setState({ key, data }))
      .catch((error: Error) => {
        if (!abort.signal.aborted) setState({ key, error: error.message });
      });
    return () => abort.abort();
  }, [key, revision]);
  useEffect(() => {
    const abort = new AbortController();
    void reportRequest<Saved[]>("/queries", { signal: abort.signal })
      .then(setSaved)
      .catch(() => {
        if (!abort.signal.aborted) setListError("Não foi possível atualizar as consultas salvas.");
      });
    return () => abort.abort();
  }, [revision]);
  useEffect(() => {
    if (!data?.canExport) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = () =>
      void reportRequest<Export[]>(`/exports?page=${exportPage}`, { signal: abort.signal })
        .then((items) => {
          setExports(items);
          if (items.some((item) => ["queued", "running"].includes(item.status)))
            timer = setTimeout(poll, 3000);
        })
        .catch(() => {
          if (!abort.signal.aborted) setListError("Não foi possível atualizar as exportações.");
        });
    poll();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [data?.canExport, revision, exportPage]);
  useEffect(() => {
    if (!presentation || !root.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const hidden: { element: HTMLElement; inert: boolean }[] = [];
    let current: HTMLElement = root.current;
    while (current.parentElement) {
      for (const sibling of current.parentElement.children) {
        if (sibling !== current && sibling instanceof HTMLElement) {
          hidden.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      current = current.parentElement;
    }
    root.current.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPresentation(false);
      if (event.key === "Tab") {
        const focusable = root.current?.querySelectorAll<HTMLElement>("button, summary, a[href]");
        const first = focusable?.[0],
          last = focusable?.[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      for (const { element, inert } of hidden) element.inert = inert;
      previous?.focus();
    };
  }, [presentation]);
  function change(values: Partial<ReportQuery>) {
    setFilters((old) => ({ ...old, ...values, page: 1 }));
  }
  function apply(next = filters) {
    const result = reportQuerySchema.safeParse(next);
    if (!result.success) {
      setError("Confira as datas, até 366 dias, e os campos selecionados.");
      return;
    }
    setError("");
    setQuery({ ...result.data, page: 1 });
  }
  async function mutate<T>(path: string, method: string, input: unknown): Promise<T | undefined> {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError("");
    setMessage("");
    const body = JSON.stringify(input),
      payload = `${path}:${method}:${body}`;
    if (retry.current.payload !== payload) retry.current = { payload, key: crypto.randomUUID() };
    try {
      const result = await reportRequest<T>(path, {
        method,
        body,
        headers: {
          "content-type": "application/json",
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": retry.current.key,
        },
      });
      retry.current = { payload: "", key: "" };
      setRevision((r) => r + 1);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Falha de conexão. Tente novamente.");
    } finally {
      running.current = false;
      setPending(false);
    }
  }
  async function save() {
    const next = await mutate<Saved>(
      selected ? `/queries/${selected.id}` : "/queries",
      selected ? "PUT" : "POST",
      { name, query: filters, notes, ...(selected ? { version: baselineVersion } : {}) },
    );
    if (next) {
      setBaselineVersion(next.version);
      cache.clear(prefix);
      cache.clear(`reports:${next.id}:`);
      setSelected(next);
      setMessage("Consulta salva. Ao abrir novamente, os dados serão atualizados.");
    }
  }
  async function exportFile(format: "pdf" | "csv" | "xlsx") {
    const result = await mutate<{ id: string }>("/exports", "POST", { query, notes, format });
    if (result) {
      setExportPage(1);
      setMessage("Exportação solicitada. Acompanhe o processamento em Exportações abaixo.");
    }
  }
  function switchView(view: ReportQuery["view"]) {
    change({ view });
    setQuery((old) => ({ ...old, view, page: 1 }));
  }
  const fields = reportCatalog[filters.dataset].columns as Record<string, string>;
  const dirtyFilters =
    JSON.stringify({ ...filters, page: 1 }) !== JSON.stringify({ ...query, page: 1 });
  return (
    <div
      ref={root}
      role={presentation ? "dialog" : undefined}
      aria-modal={presentation || undefined}
      aria-labelledby={presentation ? "reports-heading" : undefined}
      className={`page-stack ${styles.root} ${presentation ? styles.presentation : ""}`}
    >
      <header className="page-header">
        <p className="eyebrow">Relatórios e Análises</p>
        <h1 id="reports-heading">{views[query.view]}</h1>
        <p>
          {query.view === "summary"
            ? "Acompanhe a semana ou o mês e identifique o que merece atenção."
            : query.view === "details"
              ? "Explore os registros, ajuste os filtros e prepare seus arquivos."
              : "Apresente alcance, adesão, engajamento e resultados com dados verificáveis."}
        </p>
        {presentation && (
          <Button autoFocus onClick={() => setPresentation(false)}>
            <X aria-hidden="true" size={16} /> Sair da apresentação
          </Button>
        )}
      </header>
      {!presentation && (
        <>
          <nav className="module-tabs" aria-label="Áreas de relatórios">
            {Object.entries(views).map(([view, label]) => (
              <Button
                key={view}
                intent={query.view === view ? "primary" : "secondary"}
                aria-pressed={query.view === view}
                onClick={() => switchView(view as ReportQuery["view"])}
              >
                {label}
              </Button>
            ))}
          </nav>
          <section className="panel">
            <h2>Período e filtros</h2>
            <div className={styles.actions}>
              {(["week", "month"] as const).map((preset) => (
                <Button
                  key={preset}
                  onClick={() => {
                    const range = reportPreset(preset);
                    change(range);
                    apply({ ...filters, ...range });
                  }}
                >
                  {preset === "week" ? "Esta semana" : "Este mês"}
                </Button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                apply();
              }}
            >
              <div className={styles.grid}>
                <label>
                  Data inicial
                  <input
                    type="date"
                    required
                    value={filters.from}
                    onChange={(e) => change({ from: e.target.value })}
                  />
                </label>
                <label>
                  Data final
                  <input
                    type="date"
                    required
                    value={filters.to}
                    onChange={(e) => change({ to: e.target.value })}
                  />
                </label>
                <label>
                  Canal de acesso
                  <select
                    value={filters.channel}
                    onChange={(e) => change({ channel: e.target.value as ReportQuery["channel"] })}
                  >
                    {Object.entries(channelLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Ambiente das métricas
                  <select
                    value={filters.environment}
                    onChange={(e) =>
                      change({ environment: e.target.value as ReportQuery["environment"] })
                    }
                  >
                    <option value="production">Produção</option>
                    <option value="development">Desenvolvimento</option>
                    <option value="test">Teste</option>
                  </select>
                </label>
                <label>
                  Fonte de acesso
                  <input
                    placeholder="Todas as fontes"
                    list="report-sources"
                    value={filters.source}
                    onChange={(e) => change({ source: e.target.value })}
                  />
                  <datalist id="report-sources">
                    {data?.usage.sources.map((s) => (
                      <option key={s.source} value={s.source} />
                    ))}
                  </datalist>
                </label>
                {query.view === "details" && (
                  <>
                    <label>
                      Relatório
                      <select
                        value={filters.dataset}
                        onChange={(e) =>
                          change({
                            dataset: e.target.value as ReportDataset,
                            columns: [],
                            groupBy: "",
                            sort: "date",
                            search: "",
                            status: "",
                            category: "",
                            city: "",
                          })
                        }
                      >
                        {datasets.map((key) => (
                          <option key={key} value={key}>
                            {reportCatalog[key].label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Buscar por nome ou tela
                      <input
                        value={filters.search}
                        maxLength={120}
                        onChange={(e) => change({ search: e.target.value })}
                      />
                    </label>
                    {filters.dataset !== "access" && (
                      <label>
                        Datas dos registros
                        <select
                          value={filters.dateScope}
                          onChange={(e) =>
                            change({ dateScope: e.target.value as "period" | "all" })
                          }
                        >
                          <option value="period">Dentro do período</option>
                          <option value="all">Todos os registros</option>
                        </select>
                      </label>
                    )}
                    {(["status", "category", "city"] as const)
                      .filter((field) => field in fields)
                      .map((field) => (
                        <label key={field}>
                          {fields[field]}
                          <input
                            value={filters[field]}
                            maxLength={120}
                            onChange={(e) => change({ [field]: e.target.value })}
                          />
                        </label>
                      ))}
                    {filters.dataset !== "access" && (
                      <label>
                        Agrupar por
                        <select
                          value={filters.groupBy}
                          onChange={(e) =>
                            change({
                              groupBy: e.target.value,
                              sort: e.target.value ? "count" : "date",
                            })
                          }
                        >
                          <option value="">Sem agrupamento</option>
                          {Object.entries(fields).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label>
                      Ordenar por
                      <select
                        value={
                          filters.groupBy && filters.sort !== filters.groupBy
                            ? "count"
                            : filters.sort
                        }
                        onChange={(e) => change({ sort: e.target.value })}
                      >
                        {Object.entries(
                          filters.groupBy
                            ? { [filters.groupBy]: fields[filters.groupBy], count: "Quantidade" }
                            : fields,
                        ).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Ordem
                      <select
                        value={filters.direction}
                        onChange={(e) => change({ direction: e.target.value as "asc" | "desc" })}
                      >
                        <option value="desc">Decrescente</option>
                        <option value="asc">Crescente</option>
                      </select>
                    </label>
                  </>
                )}
              </div>
              {query.view === "details" && !filters.groupBy && (
                <fieldset className={styles.columns}>
                  <legend>Colunas do relatório</legend>
                  {Object.entries(fields).map(([key, label]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={!filters.columns.length || filters.columns.includes(key)}
                        onChange={(e) => {
                          const current = filters.columns.length
                            ? filters.columns
                            : Object.keys(fields);
                          const next = e.target.checked
                            ? [...current, key]
                            : current.filter((item) => item !== key);
                          if (next.length) change({ columns: next });
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </fieldset>
              )}
              <div className={styles.actions}>
                <Button type="submit" intent="primary">
                  Gerar relatório
                </Button>
                {dirtyFilters && (
                  <span role="status">
                    Aplique os filtros para atualizar os resultados e exportar.
                  </span>
                )}
              </div>
            </form>
          </section>
        </>
      )}
      {error && (
        <p role="alert" className={styles.notice}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className={styles.notice}>
          {message}
        </p>
      )}
      {listError && !presentation && (
        <section className={styles.notice}>
          <p role="alert">{listError}</p>
          <Button
            onClick={() => {
              setListError("");
              setRevision((r) => r + 1);
            }}
          >
            Atualizar listas
          </Button>
        </section>
      )}
      {!data ? (
        <section className="panel">
          {state.key === key && state.error ? (
            <>
              <p role="alert">{state.error}</p>
              <Button onClick={() => setRevision((r) => r + 1)}>Tentar novamente</Button>
            </>
          ) : (
            <p role="status">Carregando relatório…</p>
          )}
        </section>
      ) : (
        <>
          <section className="panel">
            <div className={styles.actions}>
              <p>
                <strong>
                  {query.from} a {query.to}
                </strong>{" "}
                · Atualizado em {dateTime(data.summary.updatedAt)}
              </p>
              {!presentation && data.canExport && (
                <>
                  {(
                    ["pdf", "csv", ...(query.view === "details" ? ["xlsx"] : [])] as (
                      "pdf" | "csv" | "xlsx"
                    )[]
                  ).map((format) => (
                    <Button
                      key={format}
                      disabled={pending || dirtyFilters}
                      onClick={() => void exportFile(format)}
                    >
                      <Download size={16} aria-hidden="true" />
                      {`Exportar ${format === "xlsx" ? "Excel" : format.toUpperCase()}`}
                    </Button>
                  ))}
                </>
              )}
              {query.view === "executive" && !presentation && (
                <Button onClick={() => setPresentation(true)}>
                  <Presentation size={16} aria-hidden="true" />
                  Modo apresentação
                </Button>
              )}
            </div>
            <p>Fuso: America/Bahia. Permissões e filtros são preservados nos arquivos.</p>
            {query.view !== "details" && (
              <p>
                Os indicadores de negócio usam o período. Canal, ambiente e fonte filtram os
                acessos. Os filtros de registros são usados somente na Análise detalhada.
              </p>
            )}
          </section>
          {query.view !== "details" && (
            <>
              <section className="panel">
                <h2>
                  {query.view === "executive" ? "Adesão e resultados" : "Indicadores do período"}
                </h2>
                <div className={styles.metrics}>
                  {data.summary.metrics.map((metric) => (
                    <article key={metric.id}>
                      <h3>{metric.label}</h3>
                      <strong className={styles.value}>{number(metric.value)}</strong>
                      <p>
                        Anterior: {number(metric.previous ?? 0)} ·{" "}
                        {metric.change === null
                          ? "Sem base percentual"
                          : `${metric.change > 0 ? "+" : ""}${metric.change}%`}
                      </p>
                      <details>
                        <summary>Como é calculado</summary>
                        <p>{metric.definition}</p>
                      </details>
                      {!presentation && (
                        <Button
                          size="compact"
                          onClick={() => {
                            const next = reportQuerySchema.parse({
                              ...query,
                              view: "details",
                              dataset: metric.id,
                              dateScope: "period",
                              columns: [],
                              groupBy: "",
                              sort: "date",
                              search: "",
                              status: "",
                              city: "",
                              category: "",
                            });
                            setFilters(next);
                            setQuery(next);
                          }}
                        >
                          Ver registros
                        </Button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
              <Evolution summary={data.summary} />
              <section className="panel">
                <h2>
                  {query.view === "executive" ? "Cobertura e base atual" : "Situação atual da base"}
                </h2>
                <p>Indicadores atuais de toda a base, independentes do período selecionado.</p>
                <dl className={styles.metrics}>
                  {data.summary.inventory.map((metric) => (
                    <div key={metric.label}>
                      <dt>{metric.label}</dt>
                      <dd className={styles.value}>{number(metric.value)}</dd>
                      <p>{metric.definition}</p>
                    </div>
                  ))}
                </dl>
              </section>
              <section className="panel">
                <h2>Pontos de atenção</h2>
                <ul>
                  {data.summary.notices.map((notice) => (
                    <li key={notice}>{notice}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
          {query.view === "details" && data.table && (
            <section className="panel">
              <h2>{reportCatalog[query.dataset].label}</h2>
              <p>{data.table.definition}</p>
              <p>{number(data.table.total)} registro(s)</p>
              {data.table.rows.length ? (
                <TableContainer aria-label="Resultados detalhados">
                  <Table caption="Registros do relatório">
                    <thead>
                      <tr>
                        {Object.entries(data.table.columns).map(([key, label]) => (
                          <th scope="col" key={key}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.table.rows.map((row, index) => (
                        <tr key={String(row._id ?? index)}>
                          {Object.keys(data.table!.columns).map((column) => (
                            <td key={column}>
                              {column === "name" &&
                              query.dataset !== "access" &&
                              !query.groupBy &&
                              ["members", "partners", "news", "users", "bookings"].includes(
                                query.dataset,
                              ) ? (
                                <Link
                                  href={`/${query.dataset === "bookings" ? "scheduling" : query.dataset}/${row._id}`}
                                >
                                  {String(row[column] ?? "—")}
                                </Link>
                              ) : (
                                String(row[column] ?? "—")
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableContainer>
              ) : (
                <p role="status">
                  Nenhum registro encontrado. Ajuste os filtros ou escolha outro período.
                </p>
              )}
              <nav className={styles.actions} aria-label="Páginas do relatório">
                <Button
                  disabled={query.page === 1}
                  onClick={() => setQuery({ ...query, page: query.page - 1 })}
                >
                  Anterior
                </Button>
                <span>Página {query.page}</span>
                <Button
                  disabled={!data.table.hasNextPage}
                  onClick={() => setQuery({ ...query, page: query.page + 1 })}
                >
                  Próxima
                </Button>
              </nav>
            </section>
          )}
          {(query.view !== "details" || query.dataset === "access") && (
            <Usage usage={data.usage} executive={query.view === "executive"} />
          )}
        </>
      )}
      {query.view === "executive" && (
        <section className="panel">
          <h2>Análise da gestão</h2>
          {presentation ? (
            <p className={styles.notes}>{notes || "Nenhum comentário incluído."}</p>
          ) : (
            <label>
              Comentários para a apresentação
              <textarea
                rows={5}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span>
                Interpretação da gestão, separada dos indicadores medidos. Incluída no PDF.
              </span>
            </label>
          )}
        </section>
      )}
      {!presentation && (
        <>
          <section className="panel">
            <h2>Consultas salvas</h2>
            <p>Guarde filtros e colunas. Os dados serão consultados novamente ao abrir.</p>
            <div className={styles.grid}>
              <label>
                Nome da consulta
                <input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
              </label>
            </div>
            <div className={styles.actions}>
              <Button
                intent="primary"
                disabled={pending || name.trim().length < 2}
                onClick={() => void save()}
              >
                <Plus aria-hidden="true" size={16} />
                {selected ? "Atualizar consulta" : "Salvar consulta"}
              </Button>
              <Button
                onClick={() => {
                  setName("");
                  setNotes("");
                  setError("");
                  setFilters(defaultQuery);
                  setQuery(defaultQuery);
                  setBaselineVersion(undefined);
                  cache.clear(prefix);
                  setSelected(null);
                }}
              >
                Cancelar edição
              </Button>
            </div>
            {saved.length ? (
              <ul className={styles.saved}>
                {saved.map((item) => (
                  <li key={item.id}>
                    <Button onClick={() => setSelected(item)}>{item.name}</Button>
                    <span>{views[item.configuration.query.view]}</span>
                    <Button
                      intent="ghost"
                      disabled={pending}
                      onClick={async () => {
                        const result = await mutate<{ deleted: boolean }>(
                          `/queries/${item.id}`,
                          "DELETE",
                          { version: item.version },
                        );
                        if (result?.deleted) {
                          cache.clear(`reports:${item.id}:`);
                          if (selected?.id === item.id) setSelected(null);
                          setMessage("Consulta excluída.");
                        }
                      }}
                    >
                      Excluir {item.name}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma consulta salva. Dê um nome aos filtros acima para começar.</p>
            )}
          </section>
          {data?.canExport && (
            <section className="panel">
              <h2>Exportações</h2>
              <p>
                Arquivos pessoais com os dados da geração. O acesso é conferido novamente ao baixar.
              </p>
              {exports.length ? (
                <ul className={styles.saved}>
                  {exports.slice(0, 20).map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>
                          {views[item.configuration.query.view]} ·{" "}
                          {item.configuration.format.toUpperCase()}
                        </strong>
                        <p>
                          {item.configuration.query.from} a {item.configuration.query.to} ·{" "}
                          {dateTime(item.created_at)}
                        </p>
                        <p>
                          {(
                            {
                              queued: "Aguardando processamento",
                              running: "Gerando arquivo",
                              succeeded: "Disponível",
                              failed: "Falha na geração",
                            } as Record<string, string>
                          )[item.status] ?? item.status}
                          {item.status === "running" ? ` (${item.progress}%)` : ""}
                        </p>
                        {item.status === "failed" && (
                          <p>
                            {item.safe_error_code === "REPORT_TOO_LARGE"
                              ? "Refine os filtros: limite de 50 mil linhas por arquivo."
                              : "Confira suas permissões e solicite novamente. Se persistir, consulte Processamentos."}
                          </p>
                        )}
                      </div>
                      {item.status === "succeeded" && (
                        <a
                          className={buttonVariants()}
                          href={`/api/v1/reports/exports/${item.id}/download`}
                        >
                          Baixar {item.configuration.format.toUpperCase()}
                        </a>
                      )}
                      {item.status === "failed" && (
                        <Button
                          disabled={pending}
                          onClick={() => void mutate("/exports", "POST", item.configuration)}
                        >
                          Solicitar novamente
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma exportação solicitada.</p>
              )}
              <nav className={styles.actions} aria-label="Páginas de exportações">
                <Button disabled={exportPage === 1} onClick={() => setExportPage((p) => p - 1)}>
                  Exportações anteriores
                </Button>
                <span>Página {exportPage}</span>
                <Button disabled={exports.length <= 20} onClick={() => setExportPage((p) => p + 1)}>
                  Mais exportações
                </Button>
              </nav>
            </section>
          )}
        </>
      )}
    </div>
  );
}
function Evolution({ summary }: { summary: ReportSummary }) {
  const maximum = Math.max(1, ...summary.series.map((point) => point.value));
  return (
    <section className="panel">
      <h2>Evolução mensal</h2>
      <p>Quantidade de registros por data de referência, dentro do período selecionado.</p>
      {summary.series.length ? (
        <ul className={styles.bars}>
          {summary.series.map((point) => (
            <li key={`${point.dataset}:${point.date}`}>
              <span>
                {point.date} · {reportCatalog[point.dataset as ReportDataset].label}
              </span>
              <div>
                <span
                  className={styles.bar}
                  style={{ width: `${Math.max(1, (point.value / maximum) * 100)}%` }}
                  aria-hidden="true"
                />
              </div>
              <strong>{number(point.value)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>Sem registros no período para mostrar evolução.</p>
      )}
    </section>
  );
}
function Usage({ usage, executive }: { usage: ReportUsage; executive: boolean }) {
  return (
    <section className="panel">
      <h2>{executive ? "Alcance e engajamento digital" : "Acessos e uso"}</h2>
      {!usage.firstEvent ? (
        <p role="status">
          Sem dados de coleta para este canal, ambiente e fonte. A medição começa após a integração.
        </p>
      ) : (
        <>
          <p>
            Coleta observada desde {dateTime(usage.firstEvent)} · Último evento:{" "}
            {dateTime(usage.lastEvent!)}
          </p>
          <dl className={styles.metrics}>
            {[
              ["Visualizações no período", usage.views],
              ["Sessões no período", usage.sessions],
              ["Visitantes reconhecidos", usage.visitors],
              ["Contas ativas no período", usage.accounts],
              ["Visitantes que retornaram", usage.returning],
              ["Sessões nos últimos 5 minutos", usage.recent],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className={styles.value}>{number(value as number)}</dd>
              </div>
            ))}
          </dl>
          <p>
            Contas ativas até o fim do período: 1 dia: {usage.daily} · 7 dias: {usage.weekly} · 30
            dias: {usage.monthly}.
          </p>
        </>
      )}
      <p>
        Visualização é uma abertura de tela. Sessão reúne uso com até 30 minutos de inatividade.
        Visitantes são identificadores reconhecidos, sujeitos a bloqueadores e troca de dispositivo;
        não equivalem a pessoas entre canais. Retorno exige atividade observada antes do período.
      </p>
      {usage.firstEvent && (
        <>
          <h3>Comparação com o período anterior</h3>
          <ul>
            {(["views", "sessions", "visitors", "accounts"] as const).map((key) => {
              const change = reportChange(usage[key], usage.previous[key]);
              return (
                <li key={key}>
                  {
                    {
                      views: "Visualizações",
                      sessions: "Sessões",
                      visitors: "Visitantes reconhecidos",
                      accounts: "Contas ativas",
                    }[key]
                  }
                  : {usage.previous[key]} antes → {usage[key]} agora (
                  {change === null ? "Sem base percentual" : `${change > 0 ? "+" : ""}${change}%`}).
                </li>
              );
            })}
          </ul>
          <p>
            Uma comparação pode ter cobertura parcial quando a coleta começou durante os períodos.
          </p>
          <h3>Evolução dos acessos</h3>
          <ul className={styles.bars}>
            {usage.series.map((point) => (
              <li key={point.date}>
                <span>{point.date}</span>
                <div>
                  <span
                    className={styles.bar}
                    style={{
                      width: `${Math.max(1, (point.views / Math.max(1, ...usage.series.map((p) => p.views))) * 100)}%`,
                    }}
                    aria-hidden="true"
                  />
                </div>
                <strong>{point.views}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
      <h3>Cobertura dos canais</h3>
      <ul>
        {(["admin", "site", "app"] as const).map((channel) => (
          <li key={channel}>
            {channelLabel[channel]}:{" "}
            {usage.sources
              .filter((s) => s.channel === channel)
              .map((s) => `${s.source} (${s.events} eventos observados)`)
              .join(", ") || "Sem dados na seleção"}
          </li>
        ))}
      </ul>
      <h3>Jornada de agendamento</h3>
      <p>
        Sessões com etapas em sequência. Disponível quando a fonte registra a jornada; etapa sem
        coleta não comprova abandono.
      </p>
      <ol>
        {usage.funnel.map((step) => (
          <li key={step.step}>
            {step.step}: {step.sessions}
          </li>
        ))}
      </ol>
    </section>
  );
}
