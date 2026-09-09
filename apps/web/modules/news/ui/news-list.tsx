"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ImageOff, Search, X } from "lucide-react";
import { newsListQuerySchema } from "@caab/contracts";
import type { listNewsDrafts } from "../news-service";
import { Button } from "@/components/ui/button";
import styles from "./news-list.module.css";

type Result = Awaited<ReturnType<typeof listNewsDrafts>>;
type Query = ReturnType<typeof newsListQuerySchema.parse>;
const states = [
  { value: "active", label: "Não arquivadas" },
  { value: "archived", label: "Arquivadas" },
  { value: "all", label: "Todas" },
] as const;
const queryString = (query: Query) =>
  new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value).trim()]),
  ).toString();
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));

function Thumbnail({
  item,
  canReadMedia,
}: {
  item: Result["items"][number];
  canReadMedia: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={styles.thumbnail}>
      {item.metadata.cover && canReadMedia && !failed ? (
        <img
          src={`/api/v1/news/${item.id}/media/${item.metadata.cover.fileId}`}
          alt=""
          width={160}
          height={100}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.placeholder}>
          <ImageOff size={24} aria-hidden="true" />
          <span>
            {!item.metadata.cover
              ? "Sem capa"
              : !canReadMedia
                ? "Prévia restrita"
                : "Prévia indisponível"}
          </span>
        </span>
      )}
    </div>
  );
}

export function NewsList({
  initialResult,
  initialQuery,
  canReadMedia,
}: {
  initialResult: Result;
  initialQuery: Query;
  canReadMedia: boolean;
}) {
  const [result, setResult] = useState(initialResult);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const defaults = newsListQuerySchema.parse({ collection: initialQuery.collection });
  const basePath = initialQuery.collection === "drafts" ? "/news/drafts" : "/news";
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery.search);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const current = useRef(initialQuery);
  const request = useRef<AbortController | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useCallback(
    async (next: Query, writeUrl = true) => {
      if (debounce.current) clearTimeout(debounce.current);
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      current.current = next;
      setQuery(next);
      setLoading(true);
      setError("");
      if (writeUrl)
        window.history.replaceState(window.history.state, "", `${basePath}?${queryString(next)}`);
      try {
        const response = await fetch(`/api/v1/news?${queryString(next)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "Sua sessão terminou. Entre novamente para consultar notícias."
              : "Não foi possível atualizar a lista. Tente novamente.",
          );
        const data = (await response.json()) as Result;
        if (!controller.signal.aborted) setResult(data);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "Falha de conexão.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [basePath],
  );
  useEffect(() => {
    const back = () => {
      const parsed = newsListQuerySchema.safeParse({
        ...Object.fromEntries(new URLSearchParams(window.location.search)),
        collection: initialQuery.collection,
      });
      const next = parsed.success
        ? parsed.data
        : newsListQuerySchema.parse({ collection: initialQuery.collection });
      setSearch(next.search);
      void navigate(next, false);
    };
    window.addEventListener("popstate", back);
    return () => {
      window.removeEventListener("popstate", back);
      request.current?.abort();
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [navigate, initialQuery.collection]);
  function changeText(key: "search" | "category", value: string) {
    if (key === "search") setSearch(value);
    current.current = { ...current.current, [key]: value, page: 1 };
    setQuery(current.current);
    setError("");
    request.current?.abort();
    setLoading(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void navigate(current.current), 350);
  }
  function clear() {
    setSearch("");
    void navigate(defaults);
  }
  const hasFilters = Object.entries(query).some(
    ([key, value]) => key !== "page" && value !== defaults[key as keyof Query],
  );
  function select(key: keyof Query, value: string) {
    void navigate(newsListQuerySchema.parse({ ...current.current, [key]: value, page: 1 }));
  }
  return (
    <section className={`panel ${styles.listPanel}`} aria-labelledby="news-list-title">
      <div className={styles.toolbar}>
        <div>
          <h2 id="news-list-title">
            {initialQuery.collection === "drafts" ? "Seus rascunhos" : "Suas notícias"}
          </h2>
        </div>
        <form
          className={styles.search}
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate({ ...current.current, search: search.trim(), page: 1 });
          }}
        >
          <label className="sr-only" htmlFor="news-search">
            Buscar notícias pelo título
          </label>
          <Search size={20} aria-hidden="true" />
          <input
            id="news-search"
            disabled={!ready}
            type="search"
            value={search}
            maxLength={200}
            placeholder="Buscar pelo título…"
            autoComplete="off"
            onChange={(event) => changeText("search", event.target.value)}
          />
          {search && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => {
                setSearch("");
                void navigate({ ...current.current, search: "", page: 1 });
                document.getElementById("news-search")?.focus();
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </form>
      </div>
      <div className={styles.filterBar}>
        <div className={styles.states} role="group" aria-label="Filtrar por arquivamento">
          {states.map((state) => (
            <button
              key={state.value}
              disabled={!ready}
              type="button"
              aria-pressed={query.state === state.value}
              onClick={() =>
                void navigate({
                  ...current.current,
                  search: search.trim(),
                  state: state.value,
                  page: 1,
                })
              }
            >
              {state.label}
            </button>
          ))}
        </div>
        {hasFilters && (
          <Button size="compact" intent="ghost" onClick={clear}>
            Limpar filtros
          </Button>
        )}
      </div>
      <details className={styles.filterDetails}>
        <summary>Mais filtros e ordenação</summary>
        <fieldset disabled={!ready} className={styles.filters} aria-label="Filtros de notícias">
          <label>
            Categoria
            <input
              value={query.category}
              maxLength={80}
              placeholder="Todas as categorias"
              onChange={(event) => changeText("category", event.target.value)}
            />
          </label>
          <label>
            Destino previsto
            <select
              value={query.channel}
              onChange={(event) => select("channel", event.target.value)}
            >
              <option value="all">Todos os destinos</option>
              <option value="app">Aplicativo</option>
              <option value="site">Site</option>
            </select>
          </label>
          <label>
            Destaque
            <select
              value={query.highlight}
              onChange={(event) => select("highlight", event.target.value)}
            >
              <option value="all">Com ou sem destaque</option>
              <option value="yes">Em destaque</option>
              <option value="no">Sem destaque</option>
            </select>
          </label>
          <label>
            Imagem de capa
            <select value={query.cover} onChange={(event) => select("cover", event.target.value)}>
              <option value="all">Com ou sem capa</option>
              <option value="yes">Com capa</option>
              <option value="no">Sem capa</option>
            </select>
          </label>
          <label>
            Atualização
            <select
              value={query.updatedWithin}
              onChange={(event) => select("updatedWithin", event.target.value)}
            >
              <option value="all">Qualquer período</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
          </label>
          <label>
            Ordenar por
            <select value={query.sort} onChange={(event) => select("sort", event.target.value)}>
              <option value="updated-desc">Atualização: mais recentes</option>
              <option value="updated-asc">Atualização: mais antigas</option>
              <option value="created-desc">Criação: mais recentes</option>
              <option value="created-asc">Criação: mais antigas</option>
              <option value="title-asc">Título: A–Z</option>
              <option value="title-desc">Título: Z–A</option>
            </select>
          </label>
        </fieldset>
      </details>
      <p role="status" className={styles.resultsStatus} aria-live="polite">
        {loading
          ? "Atualizando notícias…"
          : error
            ? "A lista abaixo mantém os resultados anteriores."
            : `${result.items.length} ${result.items.length === 1 ? "notícia nesta página" : "notícias nesta página"}${result.totalPages > 1 ? ` · Página ${result.page} de ${result.totalPages}` : ""}`}
      </p>
      {error && (
        <div role="alert" className={styles.error}>
          <p>{error}</p>
          <Button onClick={() => void navigate(current.current)}>Tentar novamente</Button>
        </div>
      )}
      <div aria-busy={loading} className={styles.results}>
        {!result.items.length ? (
          <div className={styles.empty}>
            <Search size={30} aria-hidden="true" />
            <h3>Nenhuma notícia encontrada</h3>
            <p>
              {hasFilters
                ? "Experimente outro título ou limpe os filtros."
                : "Crie sua primeira notícia para começar."}
            </p>
            {hasFilters && <Button onClick={clear}>Mostrar notícias não arquivadas</Button>}
          </div>
        ) : (
          <ul className={styles.items} aria-label="Lista de notícias">
            {result.items.map((item) => (
              <li key={item.id}>
                <Link
                  className={styles.item}
                  href={`/news/${item.id}`}
                  aria-labelledby={`news-list-title-${item.id}`}
                >
                  <Thumbnail
                    key={item.metadata.cover?.fileId ?? "none"}
                    item={item}
                    canReadMedia={canReadMedia}
                  />
                  <div className={styles.copy}>
                    <div className={styles.meta}>
                      <span className={item.archived ? styles.archived : styles.active}>
                        {item.archived ? "Arquivada" : "Não arquivada"}
                      </span>
                      {item.metadata.category && <span>{item.metadata.category}</span>}
                      {item.metadata.highlight && <span>Destaque</span>}
                    </div>
                    <h3 id={`news-list-title-${item.id}`}>{item.metadata.title || "Sem título"}</h3>
                    <p className={styles.summary}>
                      {item.metadata.summary || "Esta notícia ainda não tem resumo."}
                    </p>
                    <p className={styles.updated}>
                      Atualizada em {date(item.updatedAt)} · Brasília
                    </p>
                  </div>
                  <ArrowUpRight size={20} className={styles.arrow} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {result.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Paginação de notícias">
          <Button
            disabled={loading || result.page <= 1}
            onClick={() => void navigate({ ...current.current, page: result.page - 1 })}
          >
            Anterior
          </Button>
          <span>
            Página {result.page} de {result.totalPages}
          </span>
          <Button
            disabled={loading || result.page >= result.totalPages}
            onClick={() => void navigate({ ...current.current, page: result.page + 1 })}
          >
            Próxima
          </Button>
        </nav>
      )}
    </section>
  );
}
