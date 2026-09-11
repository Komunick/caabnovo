"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { uploadIntentSchema, type MemberRecord, type MemberFile } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { memberRequest, mutationHeaders } from "./client";
import { formatMemberDate, resultLabels } from "./labels";
import styles from "./members.module.css";

type FilesPage = { items: MemberFile[]; page: number; hasNextPage: boolean };
const fileLabels: Record<string, string> = {
  initiated: "Envio iniciado",
  uploaded: "Aguardando verificação",
  scanning: "Verificando segurança",
  available: "Liberado",
  rejected: "Rejeitado",
  scan_error: "Falha na verificação",
};
export function MemberDocuments({
  member,
  disabled,
  canRead,
  canUpload,
  canWrite,
  canReview,
  command,
}: {
  member: MemberRecord;
  disabled: boolean;
  canRead: boolean;
  canUpload: boolean;
  canWrite: boolean;
  canReview: boolean;
  command: (input: Record<string, unknown>) => Promise<boolean>;
}) {
  const [files, setFiles] = useState<FilesPage>({ items: [], page: 1, hasNextPage: false });
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const retry = useRef({ fingerprint: "", key: "" });
  const refresh = useCallback(async () => {
    if (canRead)
      setFiles(await memberRequest<FilesPage>(`/api/v1/members/${member.id}/files?page=${page}`));
  }, [member.id, page, canRead]);
  useEffect(() => {
    void refresh().catch((e) => setError(String(e)));
  }, [refresh]);
  async function upload(file?: File) {
    if (!file || uploading) return;
    setError("");
    setNotice("");
    if (
      !["application/pdf", "image/png", "image/jpeg"].includes(file.type) ||
      file.size === 0 ||
      file.size > 25 * 1024 * 1024
    ) {
      setError("Escolha PDF, PNG ou JPEG de até 25 MB.");
      return;
    }
    setUploading(true);
    try {
      const checksum = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      const fingerprint = `${checksum}:${file.name}:${file.size}`;
      if (retry.current.fingerprint !== fingerprint)
        retry.current = { fingerprint, key: crypto.randomUUID() };
      const intent = uploadIntentSchema.parse(
        await memberRequest("/api/v1/files/upload-intents", {
          method: "POST",
          headers: mutationHeaders(retry.current.key),
          body: JSON.stringify({
            originalName: file.name,
            declaredMime: file.type,
            sizeBytes: file.size,
            checksumSha256: checksum,
            ownerType: "member",
            ownerId: member.id,
          }),
        }),
      );
      const sent = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: intent.requiredHeaders,
        body: file,
      });
      if (!sent.ok) throw new Error("Envio não concluído. Selecione novamente para tentar.");
      await memberRequest(`/api/v1/files/${intent.fileId}/finalize`, {
        method: "POST",
        headers: mutationHeaders(crypto.randomUUID()),
        body: JSON.stringify({ checksumSha256: checksum }),
      });
      setNotice(
        "Arquivo enviado. Aguarde a verificação de segurança e atualize a lista antes de anexar.",
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally {
      setUploading(false);
    }
  }
  if (!canRead)
    return (
      <section className="panel">
        <h2>Documentos</h2>
        <p>Sua conta precisa do acesso existente a arquivos para consultar os documentos.</p>
      </section>
    );
  return (
    <section className={`panel ${styles.root}`}>
      <h2>Documentos e revisão</h2>
      <p>
        Registre a categoria solicitada para este caso. Uma substituição preserva o documento
        anterior e exige nova análise.
      </p>
      {error && <p role="alert">{error}</p>}
      <p role="status">{notice}</p>
      {canUpload && (
        <FormField id="member-upload" label="Enviar arquivo privado (PDF, PNG ou JPEG, até 25 MB)">
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            disabled={disabled || uploading || !canWrite}
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </FormField>
      )}
      <div className={styles.actions}>
        <Button
          disabled={uploading}
          onClick={() => void refresh().catch((e) => setError(String(e)))}
        >
          Atualizar arquivos
        </Button>
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Arquivos anteriores
        </Button>
        <span>Página {page}</span>
        <Button disabled={!files.hasNextPage} onClick={() => setPage(page + 1)}>
          Mais arquivos
        </Button>
      </div>
      <ul>
        {files.items.map((f) => (
          <li key={f.id}>
            {f.name} — {fileLabels[f.status] ?? "Indisponível"}
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          void command({
            action: "document",
            fileId: data.get("fileId"),
            category: data.get("category"),
            replacesId: data.get("replacesId") || null,
            justification: data.get("reason"),
          });
        }}
      >
        <fieldset disabled={disabled || uploading || !canWrite}>
          <legend>Anexar evidência ao cadastro</legend>
          <div className={styles.grid}>
            <FormField id="document-file" label="Arquivo liberado">
              <select name="fileId" required defaultValue="">
                <option value="">Selecione um arquivo</option>
                {files.items
                  .filter(
                    (f) =>
                      f.status === "available" &&
                      f.scanStatus === "clean" &&
                      !member.documents.some((d) => d.fileId === f.id),
                  )
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </FormField>
            <FormField id="document-category" label="Categoria do documento">
              <input name="category" required minLength={2} maxLength={80} />
            </FormField>
            <FormField id="document-replaces" label="Documento substituído (opcional)">
              <select name="replacesId">
                <option value="">Novo documento</option>
                {member.documents
                  .filter((d) => !member.documents.some((other) => other.replacesId === d.id))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.category} · {formatMemberDate(d.createdAt)}
                    </option>
                  ))}
              </select>
            </FormField>
          </div>
          <FormField id="document-reason" label="Motivo do envio ou substituição">
            <textarea name="reason" required minLength={3} maxLength={1000} />
          </FormField>
          <Button type="submit">Anexar documento</Button>
        </fieldset>
      </form>
      <h3>Evidências registradas</h3>
      {!member.documents.length && <p>Nenhum documento anexado.</p>}
      <ul className={styles.list}>
        {member.documents.map((doc) => {
          const replaced = member.documents.some((d) => d.replacesId === doc.id);
          return (
            <li key={doc.id} className={styles.card}>
              <strong>{doc.category}</strong> · {resultLabels[doc.result]}
              {replaced ? " · Substituído" : ""}
              <p>Enviado em {formatMemberDate(doc.createdAt)}</p>
              <a
                href={`/api/v1/members/${member.id}/files/${doc.fileId}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir documento {doc.category}
              </a>
              {doc.reason && (
                <p>
                  {doc.reason} · {doc.reviewerName} · {formatMemberDate(doc.reviewedAt)}
                </p>
              )}
              {doc.reviews.length > 0 && (
                <details>
                  <summary>Histórico de análises do documento</summary>
                  <ul>
                    {doc.reviews.map((review) => (
                      <li key={review.id}>
                        {resultLabels[review.result]} ? {review.reason} ? {review.actorName} ?{" "}
                        {formatMemberDate(review.createdAt)}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {!replaced && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const d = new FormData(e.currentTarget);
                    void command({
                      action: "review",
                      documentId: doc.id,
                      result: d.get("result"),
                      justification: d.get("reason"),
                    });
                  }}
                >
                  <fieldset disabled={disabled || !canReview}>
                    <FormField id={`review-result-${doc.id}`} label="Resultado da análise">
                      <select name="result">
                        <option value="accepted">Aceitar documento</option>
                        <option value="correction_requested">Solicitar correção</option>
                      </select>
                    </FormField>
                    <FormField
                      id={`review-reason-${doc.id}`}
                      label="Motivo da análise ou correção solicitada"
                    >
                      <textarea name="reason" required minLength={3} maxLength={1000} />
                    </FormField>
                    <Button type="submit">Registrar análise do documento</Button>
                  </fieldset>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
