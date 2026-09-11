"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { uploadIntentSchema, type PartnerFile } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { mutationHeaders, partnerRequest } from "./client";
import styles from "./partners.module.css";
type FilePage = { items: PartnerFile[]; page: number; hasNextPage: boolean };
export function ContractFiles({
  partnerId,
  disabled,
  canUpload,
  value,
  onSelect,
}: {
  partnerId: string;
  disabled: boolean;
  canUpload: boolean;
  value: string;
  onSelect: (id: string) => void;
}) {
  const [files, setFiles] = useState<FilePage>({ items: [], page: 1, hasNextPage: false });
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const retry = useRef({ fingerprint: "", key: "" });
  const refresh = useCallback(async () => {
    setFiles(await partnerRequest<FilePage>(`/api/v1/partners/${partnerId}/files?page=${page}`));
  }, [partnerId, page]);
  useEffect(() => {
    void refresh().catch((e) => setError(String(e)));
  }, [refresh]);
  useEffect(() => {
    if (!files.items.some((file) => ["initiated", "uploaded", "scanning"].includes(file.status)))
      return;
    const timer = setInterval(() => {
      void refresh().catch((e) => setError(String(e)));
    }, 4000);
    return () => clearInterval(timer);
  }, [files.items, refresh]);
  async function upload(file?: File) {
    if (!file || busy) return;
    setError("");
    setNotice("");
    if (
      !["application/pdf", "image/png", "image/jpeg"].includes(file.type) ||
      !file.size ||
      file.size > 25 * 1024 * 1024
    ) {
      setError("Escolha PDF, PNG ou JPEG de até 25 MB.");
      return;
    }
    setBusy(true);
    try {
      const checksum = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      const fingerprint = `${checksum}:${file.name}:${file.size}`;
      if (retry.current.fingerprint !== fingerprint)
        retry.current = { fingerprint, key: crypto.randomUUID() };
      const intent = uploadIntentSchema.parse(
        await partnerRequest("/api/v1/files/upload-intents", {
          method: "POST",
          headers: mutationHeaders(retry.current.key),
          body: JSON.stringify({
            originalName: file.name,
            declaredMime: file.type,
            sizeBytes: file.size,
            checksumSha256: checksum,
            ownerType: "partner",
            ownerId: partnerId,
          }),
        }),
      );
      const result = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: intent.requiredHeaders,
        body: file,
      });
      if (!result.ok)
        throw new Error("Envio não concluído. Selecione o arquivo novamente para tentar.");
      await partnerRequest(`/api/v1/files/${intent.fileId}/finalize`, {
        method: "POST",
        headers: mutationHeaders(crypto.randomUUID()),
        body: JSON.stringify({ checksumSha256: checksum }),
      });
      setNotice("Arquivo enviado. Aguarde a liberação e selecione o documento abaixo.");
      setPage(1);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }
  const labels: Record<string, string> = {
    initiated: "Envio iniciado",
    uploaded: "Aguardando verificação",
    scanning: "Verificando segurança",
    available: "Liberado",
    rejected: "Rejeitado",
    scan_error: "Falha na verificação",
  };
  return (
    <div className={styles.card}>
      <h3>Documento privado (opcional)</h3>
      {error && <p role="alert">{error}</p>}
      <p role="status">{notice}</p>
      {canUpload && (
        <FormField id="contract-upload" label="Enviar PDF, PNG ou JPEG, até 25 MB">
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            disabled={disabled || busy}
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </FormField>
      )}
      <FormField id="contract-file" label="Documento do contrato">
        <select
          disabled={disabled || busy}
          value={value}
          onChange={(event) => onSelect(event.target.value)}
        >
          <option value="">Sem documento anexado</option>
          {value && !files.items.some((file) => file.id === value) && (
            <option value={value}>Documento selecionado em outra página</option>
          )}
          {files.items.map((file) => (
            <option
              key={file.id}
              value={file.id}
              disabled={file.status !== "available" || file.scanStatus !== "clean"}
            >
              {file.name} — {labels[file.status] ?? "Indisponível"}
            </option>
          ))}
        </select>
      </FormField>
      <div className={styles.actions}>
        <Button
          type="button"
          disabled={busy || disabled}
          onClick={() => {
            void refresh().catch((e) => setError(String(e)));
          }}
        >
          Atualizar arquivos
        </Button>
        {page > 1 && (
          <Button type="button" onClick={() => setPage(page - 1)}>
            Arquivos anteriores
          </Button>
        )}
        {files.hasNextPage && (
          <Button type="button" onClick={() => setPage(page + 1)}>
            Mais arquivos
          </Button>
        )}
      </div>
    </div>
  );
}
