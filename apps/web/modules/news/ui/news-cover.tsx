"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_UPLOAD_SIZE_BYTES, uploadIntentSchema, type NewsDraftMetadata } from "@caab/contracts";
import type { listNewsMedia } from "../media-service";
import { Button } from "@/components/ui/button";
import { ImagePlus, Check, ImageOff, UploadCloud } from "lucide-react";
import { FormField } from "@/components/ui/form-field";

type MediaPage = Awaited<ReturnType<typeof listNewsMedia>>;
const labels: Record<string, string> = {
  initiated: "Aguardando envio",
  uploaded: "Aguardando verificação",
  scanning: "Em verificação",
  available: "Disponível",
  rejected: "Arquivo rejeitado",
  scan_error: "Falha na verificação",
  deleted: "Removido",
};
function mutationHeaders(key?: string) {
  return {
    "content-type": "application/json",
    "x-csrf-token": crypto.randomUUID(),
    ...(key ? { "idempotency-key": key } : {}),
  };
}

export function NewsCover({
  fieldError,
  altError,
  newsId,
  onEnsureNewsId,
  cover,
  canRead,
  canUpload,
  disabled,
  onChange,
  onUploadingChange,
  purpose = "cover",
}: Readonly<{
  fieldError?: string;
  altError?: string;
  newsId?: string;
  onEnsureNewsId?(): Promise<string | undefined>;
  cover: NewsDraftMetadata["cover"];
  canRead: boolean;
  canUpload: boolean;
  disabled: boolean;
  onChange(cover: NewsDraftMetadata["cover"]): void;
  onUploadingChange(uploading: boolean): void;
  purpose?: "cover" | "body";
}>) {
  const prefix = purpose === "cover" ? "news-cover" : "news-body-image";
  const [media, setMedia] = useState<MediaPage>({ items: [], page: 1, hasNextPage: false });
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [localPreview, setLocalPreview] = useState<{ fileId: string; url: string }>();
  const selected = media.items.find((file) => file.id === cover?.fileId);
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview.url);
    },
    [localPreview],
  );
  const retry = useRef<{ checksum: string; key: string } | undefined>(undefined);
  const pendingScan = media.items.some((file) =>
    ["initiated", "uploaded", "scanning"].includes(file.status),
  );
  const refresh = useCallback(
    async (signal?: AbortSignal, ownerId = newsId) => {
      if (!canRead || !ownerId) return;
      const response = await fetch(`/api/v1/news/${ownerId}/media?page=${page}`, {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Não foi possível consultar as imagens desta notícia.");
      const result = (await response.json()) as MediaPage;
      setMedia(result);
      return result;
    },
    [canRead, newsId, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        await refresh(controller.signal);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "Falha ao consultar imagens.");
      }
      if (!controller.signal.aborted && pendingScan) timer = setTimeout(poll, 5000);
    }
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [refresh, pendingScan]);
  useEffect(() => setImageFailed(false), [cover?.fileId, selected?.usable]);

  async function upload(file?: File) {
    if (!file || uploading) return;
    setError("");
    setMessage("");
    if (
      !["image/png", "image/jpeg"].includes(file.type) ||
      file.size === 0 ||
      file.size > MAX_UPLOAD_SIZE_BYTES
    ) {
      setError("Escolha uma imagem PNG ou JPEG de até 25 MB.");
      return;
    }
    setUploading(true);
    onUploadingChange(true);
    try {
      const ownerId = newsId ?? (await onEnsureNewsId?.());
      if (!ownerId)
        throw new Error(
          "Não foi possível preparar a notícia. Confira os campos e tente enviar a imagem novamente.",
        );
      const checksum = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
      const fingerprint = `${checksum}:${file.name}:${file.type}:${file.size}`;
      if (retry.current?.checksum !== fingerprint)
        retry.current = { checksum: fingerprint, key: crypto.randomUUID() };
      const intentResponse = await fetch("/api/v1/files/upload-intents", {
        method: "POST",
        headers: mutationHeaders(retry.current.key),
        body: JSON.stringify({
          originalName: file.name,
          declaredMime: file.type,
          sizeBytes: file.size,
          checksumSha256: checksum,
          ownerType: "news",
          ownerId,
        }),
      });
      if (!intentResponse.ok) throw new Error("Não foi possível iniciar o envio da imagem.");
      const intent = uploadIntentSchema.parse(await intentResponse.json());
      const uploaded = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: intent.requiredHeaders,
        body: file,
      });
      if (!uploaded.ok)
        throw new Error("O envio não foi concluído. Selecione a imagem para tentar novamente.");
      const finalized = await fetch(`/api/v1/files/${intent.fileId}/finalize`, {
        method: "POST",
        headers: mutationHeaders(),
        body: JSON.stringify({ checksumSha256: checksum }),
      });
      if (!finalized.ok)
        throw new Error(
          "A imagem foi enviada, mas não foi possível iniciar sua verificação. Tente novamente.",
        );
      retry.current = undefined;
      setLocalPreview({ fileId: intent.fileId, url: URL.createObjectURL(file) });
      onChange({ fileId: intent.fileId, alt: "" });
      setMessage(
        purpose === "cover"
          ? "Imagem enviada para verificação. Descreva a capa antes de publicar."
          : "Imagem enviada para verificação. Descreva a imagem antes de inseri-la.",
      );
      await refresh(undefined, ownerId);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Falha de conexão durante o envio.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }
  return (
    <section className="news-cover" aria-labelledby={`${prefix}-title`}>
      <h3 id={`${prefix}-title`}>
        {purpose === "cover" ? "Imagem de capa" : "Imagem no conteúdo"}
      </h3>
      {canUpload && canRead ? (
        <div
          className="news-upload-zone"
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (!disabled && !uploading) void upload(event.dataTransfer.files[0]);
          }}
        >
          <UploadCloud size={28} aria-hidden="true" />
          <p>
            <strong>{cover ? "Trocar imagem" : "Adicionar imagem"}</strong>
            <br />
            Arraste aqui ou escolha um arquivo.
          </p>
          <FormField
            id={`${prefix}-file`}
            error={error || fieldError || undefined}
            label="Enviar imagem"
            hint="PNG ou JPEG, até 25 MB. A imagem passa por verificação antes de ficar disponível."
          >
            <input
              type="file"
              className="news-file-input"
              accept="image/png,image/jpeg"
              disabled={disabled || uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                void upload(file);
                event.target.value = "";
              }}
            />
          </FormField>
        </div>
      ) : null}
      {!canRead ? (
        <p>Seu acesso atual não inclui a consulta de arquivos.</p>
      ) : (
        <>
          {media.items.length > 0 && (
            <details className="news-media-library" open={!cover}>
              <summary>
                <ImagePlus size={18} aria-hidden="true" /> Biblioteca desta notícia (
                {media.items.length})
              </summary>
              <div className="news-media-grid" role="group" aria-label="Imagens desta notícia">
                {media.items
                  .filter((file) => ["image/png", "image/jpeg"].includes(file.mime))
                  .map((file) => (
                    <button
                      type="button"
                      key={file.id}
                      className="news-media-choice"
                      data-file-id={file.id}
                      disabled={
                        disabled || uploading || ["rejected", "deleted"].includes(file.status)
                      }
                      aria-pressed={cover?.fileId === file.id}
                      onClick={() =>
                        onChange({
                          fileId: file.id,
                          alt: cover?.fileId === file.id ? cover.alt : "",
                        })
                      }
                    >
                      {file.usable ? (
                        <img
                          src={`/api/v1/news/${newsId}/media/${file.id}`}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <span className="news-media-placeholder">
                          <ImageOff size={24} aria-hidden="true" />
                        </span>
                      )}
                      <span className="news-media-filename">{file.name}</span>
                      <span className="news-media-status">
                        {labels[file.status] ?? "Indisponível"}
                      </span>
                      {cover?.fileId === file.id && (
                        <Check className="news-media-check" size={19} aria-hidden="true" />
                      )}
                    </button>
                  ))}
              </div>
            </details>
          )}
          {fieldError && (
            <p className="field-error" role="alert">
              {fieldError}
            </p>
          )}
          {(page > 1 || media.hasNextPage) && (
            <div className="news-actions">
              <Button
                size="compact"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Imagens anteriores
              </Button>
              <span>Página {page}</span>
              <Button
                size="compact"
                disabled={!media.hasNextPage}
                onClick={() => setPage((value) => value + 1)}
              >
                Mais imagens
              </Button>
            </div>
          )}
        </>
      )}
      {cover ? (
        <>
          <p className="news-selected-image" role="status">
            <Check size={17} aria-hidden="true" /> {selected?.name || "Imagem selecionada"}{" "}
            <span>{selected?.usable ? "Disponível" : labels[selected?.status ?? "uploaded"]}</span>
          </p>
          {canRead &&
          (selected?.usable || localPreview?.fileId === cover.fileId) &&
          !imageFailed ? (
            <img
              className="news-cover-image"
              src={
                selected?.usable
                  ? `/api/v1/news/${newsId}/media/${cover.fileId}`
                  : localPreview?.url
              }
              alt={cover.alt || "Prévia da imagem selecionada"}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <p>
              {selected && !selected.usable
                ? "A imagem ainda não está liberada para exibição."
                : "A prévia da imagem não está disponível nesta página."}
            </p>
          )}
          <FormField
            id={`${prefix}-alt`}
            error={altError}
            label={purpose === "cover" ? "Descrição da capa" : "Descrição da imagem"}
            hint="Descreva o que a imagem comunica. Obrigatória antes de publicar."
          >
            <textarea
              rows={2}
              maxLength={500}
              value={cover.alt}
              disabled={disabled}
              onChange={(event) => onChange({ ...cover, alt: event.target.value })}
            />
          </FormField>
          <Button disabled={disabled || uploading} onClick={() => onChange(null)}>
            {purpose === "cover" ? "Remover capa do rascunho" : "Limpar seleção"}
          </Button>
        </>
      ) : null}
      {uploading ? (
        <p role="status">Enviando imagem…</p>
      ) : message ? (
        <p role="status">{message}</p>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
