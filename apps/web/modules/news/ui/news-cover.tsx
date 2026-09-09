"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_UPLOAD_SIZE_BYTES, uploadIntentSchema, type NewsDraftMetadata } from "@caab/contracts";
import type { listNewsMedia } from "../media-service";
import { Button } from "@/components/ui/button";
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
  newsId,
  cover,
  canRead,
  canUpload,
  disabled,
  onChange,
  onUploadingChange,
  purpose = "cover",
}: Readonly<{
  newsId: string;
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
  const retry = useRef<{ checksum: string; key: string } | undefined>(undefined);
  const pendingScan = media.items.some((file) =>
    ["initiated", "uploaded", "scanning"].includes(file.status),
  );
  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!canRead) return;
      const response = await fetch(`/api/v1/news/${newsId}/media?page=${page}`, {
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
  useEffect(() => setImageFailed(false), [cover?.fileId]);

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
          ownerId: newsId,
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
      onChange({ fileId: intent.fileId, alt: "" });
      setMessage(
        purpose === "cover"
          ? "Imagem enviada para verificação. Descreva a capa e salve o rascunho."
          : "Imagem enviada para verificação. Descreva a imagem antes de inseri-la.",
      );
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Falha de conexão durante o envio.");
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }
  const selected = media.items.find((file) => file.id === cover?.fileId);
  return (
    <section className="news-cover" aria-labelledby={`${prefix}-title`}>
      <h3 id={`${prefix}-title`}>
        {purpose === "cover" ? "Imagem de capa" : "Imagem no conteúdo"}
      </h3>
      {canUpload && canRead ? (
        <FormField
          id={`${prefix}-file`}
          label="Enviar imagem"
          hint="PNG ou JPEG, até 25 MB. A imagem passa por verificação antes de ficar disponível."
        >
          <input
            type="file"
            accept="image/png,image/jpeg"
            disabled={disabled || uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              void upload(file);
              event.target.value = "";
            }}
          />
        </FormField>
      ) : null}
      {!canRead ? (
        <p>Seu acesso atual não inclui a consulta de arquivos.</p>
      ) : (
        <>
          <FormField id={`${prefix}-select`} label="Imagens desta notícia">
            <select
              value={cover?.fileId ?? ""}
              disabled={disabled || uploading}
              onChange={(event) =>
                onChange(event.target.value ? { fileId: event.target.value, alt: "" } : null)
              }
            >
              <option value="">{purpose === "cover" ? "Sem capa" : "Escolha uma imagem"}</option>
              {cover && !selected ? (
                <option value={cover.fileId}>Imagem selecionada em outra página</option>
              ) : null}
              {media.items
                .filter((file) => ["image/png", "image/jpeg"].includes(file.mime))
                .map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.name} —{" "}
                    {file.status === "available" && !file.usable
                      ? "Indisponível"
                      : (labels[file.status] ?? "Indisponível")}
                  </option>
                ))}
            </select>
          </FormField>
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
        </>
      )}
      {cover ? (
        <>
          <FormField
            id={`${prefix}-alt`}
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
          {canRead && selected?.usable && !imageFailed ? (
            <img
              className="news-cover-image"
              src={`/api/v1/news/${newsId}/media/${cover.fileId}`}
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
