"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  emptyNewsBody,
  newsDraftMetadataSchema,
  updateNewsDraftRequestSchema,
  type NewsDraftMetadata,
} from "@caab/contracts";
import type { NewsRecord, listNewsVersions } from "../news-service";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { RichTextEditor } from "./rich-text-editor";
import { NewsCover } from "./news-cover";
import { NewsPublishing } from "./news-publishing";

type History = Awaited<ReturnType<typeof listNewsVersions>>;
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));

async function responseError(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { code?: string };
  if (response.status === 401) return "Sua sessão expirou. Entre novamente antes de salvar.";
  if (data.code === "NEWS_VERSION_CONFLICT")
    return "Outra alteração foi salva. Seu texto continua no editor. Abra a versão atual em outra aba e compare antes de tentar novamente.";
  if (response.status === 422)
    return "Confira os campos e a formatação do conteúdo antes de salvar.";
  if (response.status === 413) return "O conteúdo ultrapassa o limite permitido.";
  return "Não foi possível concluir. Seu texto continua no editor; tente novamente.";
}

export function NewsEditor({
  initial,
  initialHistory,
  canReadMedia = false,
  canUploadMedia = false,
}: Readonly<{
  initial?: NewsRecord;
  initialHistory?: History;
  canReadMedia?: boolean;
  canUploadMedia?: boolean;
}>) {
  const router = useRouter();
  const [record, setRecord] = useState(initial);
  const [metadata, setMetadata] = useState(initial?.metadata ?? newsDraftMetadataSchema.parse({}));
  const [body, setBody] = useState<unknown>(initial?.body ?? emptyNewsBody);
  const [history, setHistory] = useState<History>(
    initialHistory ?? { items: [], page: 1, totalPages: 1 },
  );
  const [editorKey, setEditorKey] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<{ action: "archive" | "restore"; versionId?: string }>();
  const retry = useRef<{ input: string; key: string } | undefined>(undefined);
  const busy = useRef(false);
  const bodyChanged = useCallback((value: unknown) => {
    setBody(value);
    setDirty(true);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  function change<K extends keyof NewsDraftMetadata>(key: K, value: NewsDraftMetadata[K]) {
    setMetadata((old) => ({ ...old, [key]: value }));
    setDirty(true);
    setMessage("");
  }
  async function loadHistory(page = 1) {
    if (!record) return;
    try {
      const response = await fetch(`/api/v1/news/${record.id}/versions?page=${page}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(await responseError(response));
      setHistory((await response.json()) as History);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível carregar o histórico.");
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy.current || mediaUploading) return;
    const parsed = updateNewsDraftRequestSchema.safeParse({
      expectedVersion: record?.revision ?? 1,
      metadata,
      body,
    });
    if (!parsed.success) {
      setError(
        "Confira título, endereço, tags e conteúdo. Use somente a formatação disponível no editor.",
      );
      return;
    }
    const input = JSON.stringify(
      record ? parsed.data : { metadata: parsed.data.metadata, body: parsed.data.body },
    );
    if (retry.current?.input !== input) retry.current = { input, key: crypto.randomUUID() };
    busy.current = true;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(record ? `/api/v1/news/${record.id}` : "/api/v1/news", {
        method: record ? "PUT" : "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": retry.current.key,
        },
        body: input,
      });
      if (!response.ok) throw new Error(await responseError(response));
      const saved = (await response.json()) as NewsRecord;
      setDirty(false);
      setRecord(saved);
      retry.current = undefined;
      setMessage(`Rascunho salvo. Revisão ${saved.revision}.`);
      if (!record) router.replace(`/news/${saved.id}`);
      else await loadHistory();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Falha de conexão. Seu texto continua no editor.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function command(action: "duplicate" | "archive" | "restore", versionId?: string) {
    if (!record || busy.current || mediaUploading || dirty) return;
    busy.current = true;
    setPending(true);
    setError("");
    const input = JSON.stringify({
      expectedVersion: record.revision,
      ...(versionId ? { versionId } : {}),
    });
    const fingerprint = `${action}:${record.id}:${input}`;
    if (retry.current?.input !== fingerprint)
      retry.current = { input: fingerprint, key: crypto.randomUUID() };
    try {
      const response = await fetch(`/api/v1/news/${record.id}/${action}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": retry.current.key,
        },
        body: input,
      });
      if (!response.ok) throw new Error(await responseError(response));
      const saved = (await response.json()) as NewsRecord;
      retry.current = undefined;
      setConfirm(undefined);
      if (action === "duplicate") {
        router.push(`/news/${saved.id}`);
        return;
      }
      setRecord(saved);
      setMetadata(saved.metadata);
      setBody(saved.body);
      setEditorKey((key) => key + 1);
      setDirty(false);
      setMessage(
        action === "archive"
          ? "Notícia arquivada. O histórico foi preservado."
          : "Versão recuperada como novo rascunho.",
      );
      await loadHistory();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <div className="news-workspace">
      <section className="panel" aria-labelledby="news-editor-title">
        <h2 id="news-editor-title">
          {record?.archived ? "Notícia arquivada" : "Rascunho editorial"}
        </h2>
        <p>
          {record
            ? `Revisão ${record.revision} · ${date(record.updatedAt)} (Brasília)`
            : "Você pode salvar mesmo sem preencher todos os campos."}
        </p>
        <p role="status">
          {dirty
            ? "Alterações ainda não salvas."
            : message || "Salvar rascunho mantém a publicação atual."}
        </p>
        {error ? (
          <p role="alert">
            {error}{" "}
            {record ? (
              <a href={`/news/${record.id}`} target="_blank" rel="noopener noreferrer">
                Abrir versão atual em outra aba
              </a>
            ) : null}
          </p>
        ) : null}
        <form onSubmit={save}>
          <fieldset
            disabled={pending || mediaUploading || record?.archived}
            className="news-fields"
          >
            <legend className="sr-only">Dados da notícia</legend>
            <FormField id="news-title" label="Título">
              <input
                value={metadata.title}
                maxLength={200}
                onChange={(e) => change("title", e.target.value)}
              />
            </FormField>
            <FormField id="news-summary" label="Resumo">
              <textarea
                value={metadata.summary}
                maxLength={500}
                rows={3}
                onChange={(e) => change("summary", e.target.value)}
              />
            </FormField>
            <FormField
              id="news-slug"
              label="Endereço legível"
              hint="Letras minúsculas, números e hífens. Ex.: atendimento-em-setembro"
            >
              <input
                value={metadata.slug}
                maxLength={180}
                onChange={(e) => change("slug", e.target.value)}
              />
            </FormField>
            <div className="news-meta-grid">
              <FormField id="news-category" label="Categoria">
                <input
                  value={metadata.category}
                  maxLength={80}
                  onChange={(e) => change("category", e.target.value)}
                />
              </FormField>
              <FormField id="news-tags" label="Tags" hint="Separe por vírgulas; até 20 tags.">
                <input
                  value={metadata.tags.join(",")}
                  onChange={(e) => change("tags", e.target.value ? e.target.value.split(",") : [])}
                />
              </FormField>
            </div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={!!metadata.highlight}
                onChange={(event) =>
                  change("highlight", event.target.checked ? { order: 1 } : null)
                }
              />
              Destacar notícia
            </label>
            {metadata.highlight ? (
              <FormField
                id="news-highlight-order"
                label="Ordem do destaque"
                hint="De 1 a 100. Números menores aparecem primeiro; empates usam a publicação mais recente."
              >
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={metadata.highlight.order}
                  onChange={(event) => change("highlight", { order: Number(event.target.value) })}
                />
              </FormField>
            ) : null}
            <p>
              O destaque usa esta mesma notícia, capa e destinos. Alterações aparecem após publicar.
            </p>
            <fieldset>
              <legend>Destinos previstos</legend>
              {(["site", "app"] as const).map((channel) => (
                <label key={channel} className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={metadata.channels.includes(channel)}
                    onChange={(e) =>
                      change(
                        "channels",
                        e.target.checked
                          ? [...metadata.channels, channel]
                          : metadata.channels.filter((item) => item !== channel),
                      )
                    }
                  />
                  {channel === "site" ? "Site" : "Aplicativo"}
                </label>
              ))}
            </fieldset>
            <div className="form-field">
              <label htmlFor="news-body">Conteúdo da notícia</label>
              <p id="news-body-hint" className="field-hint">
                Texto, títulos, listas e imagens. Salve antes de abrir a prévia.
              </p>
              <RichTextEditor
                key={editorKey}
                initialBody={record?.body ?? emptyNewsBody}
                disabled={pending || mediaUploading || !!record?.archived}
                onChange={bodyChanged}
                newsId={record?.id}
                canReadMedia={canReadMedia}
                canUploadMedia={canUploadMedia}
                onUploadingChange={setMediaUploading}
              />
            </div>
            {record ? (
              <NewsCover
                newsId={record.id}
                cover={metadata.cover}
                canRead={canReadMedia}
                canUpload={canUploadMedia}
                disabled={pending || !!record.archived}
                onChange={(cover) => change("cover", cover)}
                onUploadingChange={setMediaUploading}
              />
            ) : (
              <p>Salve o primeiro rascunho para adicionar uma capa.</p>
            )}
            <Button type="submit" intent="primary" disabled={pending || mediaUploading}>
              {pending ? "Salvando…" : "Salvar rascunho"}
            </Button>
          </fieldset>
        </form>
        {record ? (
          <div className="news-actions">
            {!dirty ? (
              <Link href={`/news/${record.id}/preview`}>Prévia privada</Link>
            ) : (
              <span>Salve para atualizar a prévia.</span>
            )}
            <Button
              disabled={pending || mediaUploading || dirty}
              onClick={() => void command("duplicate")}
            >
              Duplicar
            </Button>
            <span className="field-hint">
              A cópia preserva o texto e remove imagens e destinos.
            </span>
            {!record.archived ? (
              <Button
                disabled={pending || mediaUploading || dirty}
                onClick={() => setConfirm({ action: "archive" })}
              >
                Arquivar
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>
      {record ? (
        <NewsPublishing
          record={record}
          dirty={dirty}
          disabled={pending || mediaUploading}
          onBusyChange={setMediaUploading}
          onSaved={(saved) => {
            setRecord(saved);
            setMetadata(saved.metadata);
            setBody(saved.body);
            setEditorKey((key) => key + 1);
            setDirty(false);
            void loadHistory();
          }}
        />
      ) : null}
      {record ? (
        <section className="panel" aria-labelledby="news-history-title">
          <h2 id="news-history-title">Histórico de versões</h2>
          <p>Recuperar uma versão cria outro rascunho. A publicação exige uma ação própria.</p>
          {history.items.length === 0 ? (
            <p>Nenhuma versão disponível.</p>
          ) : (
            <ol className="news-history">
              {history.items.map((version) => (
                <li key={version.id}>
                  <strong>Revisão {version.revision}</strong>
                  <p>
                    {version.title || "Sem título"}
                    <br />
                    {date(version.createdAt)} (Brasília){version.archived ? " · Arquivada" : ""}
                  </p>
                  <Button
                    size="compact"
                    disabled={pending || mediaUploading || dirty}
                    onClick={() => setConfirm({ action: "restore", versionId: version.id })}
                  >
                    Recuperar revisão {version.revision}
                  </Button>
                </li>
              ))}
            </ol>
          )}
          <div className="news-actions">
            <Button
              disabled={history.page <= 1 || pending}
              onClick={() => void loadHistory(history.page - 1)}
            >
              Versões anteriores na lista
            </Button>
            <span>
              Página {history.page} de {Math.max(1, history.totalPages)}
            </span>
            <Button
              disabled={history.page >= history.totalPages || pending}
              onClick={() => void loadHistory(history.page + 1)}
            >
              Mais versões
            </Button>
          </div>
        </section>
      ) : null}
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !pending) setConfirm(undefined);
        }}
      >
        <DialogContent
          title={confirm?.action === "archive" ? "Arquivar notícia" : "Recuperar versão"}
          description={
            confirm?.action === "archive"
              ? "A notícia ficará arquivada e seu histórico será preservado."
              : "O conteúdo escolhido será salvo como uma nova revisão de rascunho."
          }
        >
          {error ? <p role="alert">{error}</p> : null}
          <div className="news-actions">
            <DialogClose asChild>
              <Button disabled={pending}>Cancelar</Button>
            </DialogClose>
            <Button
              intent="primary"
              disabled={pending}
              onClick={() => confirm && void command(confirm.action, confirm.versionId)}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
