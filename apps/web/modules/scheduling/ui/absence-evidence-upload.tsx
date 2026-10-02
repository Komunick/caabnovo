"use client";
import { useEffect, useRef, useState } from "react";
import {
  DOCUMENT_FILE_ACCEPT,
  MAX_UPLOAD_SIZE_BYTES,
  uploadIntentSchema,
  uploadMimeSchema,
  type MemberFile,
} from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useDraftState } from "@/components/workspace-drafts";
import { memberRequest, mutationHeaders } from "@/modules/members/ui/client";

export type AbsenceEvidenceDraft = {
  file: File;
  key: string;
  id?: string;
  checksum?: string;
  url?: string;
  headers?: Record<string, string>;
  uploaded?: boolean;
  finalized?: boolean;
  available?: boolean;
};

export function AbsenceEvidenceUpload({
  memberId,
  draftKey,
  value,
  onChange,
  disabled,
  error: fieldError,
}: {
  memberId: string;
  draftKey: string;
  value?: AbsenceEvidenceDraft;
  onChange: (value: AbsenceEvidenceDraft | undefined) => void;
  disabled: boolean;
  error?: string;
}) {
  const [error, setError] = useDraftState(`${draftKey}:upload-error`, "");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function upload() {
    if (!value || pending) return;
    setError("");
    setPending(true);
    const abort = new AbortController();
    controller.current = abort;
    let current = value;
    const save = (change: Partial<AbsenceEvidenceDraft>) => {
      current = { ...current, ...change };
      onChange(current);
    };
    try {
      if (!current.id) {
        setNotice("Preparando comprovante…");
        const checksum = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", await current.file.arrayBuffer())),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("");
        const intent = uploadIntentSchema.parse(
          await memberRequest("/api/v1/files/upload-intents", {
            method: "POST",
            signal: abort.signal,
            headers: mutationHeaders(current.key),
            body: JSON.stringify({
              originalName: current.file.name,
              declaredMime: current.file.type,
              sizeBytes: current.file.size,
              checksumSha256: checksum,
              ownerType: "member",
              ownerId: memberId,
            }),
          }),
        );
        save({
          id: intent.fileId,
          checksum,
          url: intent.uploadUrl,
          headers: intent.requiredHeaders,
        });
      }
      if (!current.uploaded) {
        setNotice("Enviando comprovante…");
        const sent = await fetch(current.url!, {
          method: "PUT",
          headers: current.headers,
          body: current.file,
          signal: abort.signal,
        });
        if (!sent.ok) {
          // Reuse the intent key to obtain a fresh upload grant on retry.
          save({ id: undefined, url: undefined, headers: undefined });
          throw new Error("Não foi possível enviar o comprovante. Tente novamente.");
        }
        save({ uploaded: true });
      }
      if (!current.finalized) {
        await memberRequest(`/api/v1/files/${current.id}/finalize`, {
          method: "POST",
          signal: abort.signal,
          headers: mutationHeaders(current.key),
          body: JSON.stringify({ checksumSha256: current.checksum }),
        });
        save({ finalized: true });
      }
      save({ available: false });
      const status = await memberRequest<MemberFile>(
        `/api/v1/members/${memberId}/files/${current.id}/status`,
        { signal: abort.signal },
      );
      if (status.status === "rejected")
        throw new Error(
          "O comprovante não passou pela verificação de segurança. Escolha outro arquivo.",
        );
      if (status.status === "scan_error")
        throw new Error("A verificação está indisponível. Aguarde e atualize a verificação.");
      const available = status.status === "available" && status.scanStatus === "clean";
      save({ available });
      setNotice(
        available
          ? "Comprovante liberado para anexar ao pedido."
          : "Comprovante enviado. Aguarde a verificação de segurança e atualize a verificação antes de enviar o pedido.",
      );
    } catch (caught) {
      if (!abort.signal.aborted)
        setError(
          caught instanceof Error ? caught.message : "Não foi possível enviar o comprovante.",
        );
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <FormField
        id={`${draftKey}-file`}
        label="Comprovante obrigatório"
        hint="PDF, PNG, JPG ou JPEG de até 25 MB. O pedido só pode ser enviado após a liberação do arquivo."
        error={fieldError || error}
      >
        <input
          type="file"
          accept={DOCUMENT_FILE_ACCEPT}
          disabled={disabled || pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setError("");
            setNotice("");
            if (
              !uploadMimeSchema.safeParse(file.type).success ||
              file.size < 1 ||
              file.size > MAX_UPLOAD_SIZE_BYTES
            ) {
              onChange(undefined);
              setError("Escolha PDF, PNG, JPG ou JPEG de até 25 MB.");
            } else onChange({ file, key: crypto.randomUUID() });
            event.target.value = "";
          }}
        />
      </FormField>
      {value && (
        <>
          <p style={{ overflowWrap: "anywhere" }}>
            {value.file.name} ·{" "}
            {value.available
              ? "Liberado"
              : value.finalized
                ? "Aguardando verificação"
                : "Ainda não anexado"}
          </p>
          <div className="scheduling-actions">
            <Button disabled={disabled || pending} onClick={() => void upload()}>
              {pending
                ? "Processando…"
                : value.finalized
                  ? "Atualizar verificação"
                  : "Enviar comprovante"}
            </Button>
            <Button
              disabled={disabled || pending}
              onClick={() => {
                onChange(undefined);
                setError("");
                setNotice("");
              }}
            >
              Remover do pedido
            </Button>
          </div>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
    </div>
  );
}
