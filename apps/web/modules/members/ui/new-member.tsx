"use client";
import { useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MemberRecord } from "@caab/contracts";
import { ProfileForm } from "./profile-form";
import { memberRequest, mutationHeaders } from "./client";
import { NewMemberPhoto } from "./member-photo";
import { uploadMemberPhoto, type PreparedPhoto } from "./photo-upload";
import { Button } from "@/components/ui/button";
import styles from "./members.module.css";
export function NewMember({ canUpload }: { canUpload: boolean }) {
  const drafts = useDraftCache();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useDraftState("new-member:error", "");
  const [notice, setNotice] = useState("");
  const [file, setFile] = useDraftState<File | undefined>("new-member:file", undefined);
  const [created, setCreated] = useDraftState<MemberRecord | undefined>(
    "new-member:created",
    undefined,
  );
  const prepared = useRef<PreparedPhoto | null>(null);
  const uploadKey = useRef(crypto.randomUUID());
  const photoKey = useRef({ body: "", key: "" });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const retry = useRef({ body: "", key: "" });
  async function finishPhoto(record: MemberRecord) {
    if (!file) {
      drafts.clear();
      router.push(`/members/${record.id}`);
      return;
    }
    setBusy(true);
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 120_000);
    try {
      const fileId = await uploadMemberPhoto(
        file,
        record.id,
        prepared,
        uploadKey,
        abort.signal,
        setNotice,
      );
      abort.signal.throwIfAborted();
      window.clearTimeout(timeout);
      setNotice("Salvando a foto…");
      const body = JSON.stringify({
        action: "photo",
        fileId,
        expectedVersion: record.version,
      });
      if (photoKey.current.body !== body) photoKey.current = { body, key: crypto.randomUUID() };
      await memberRequest(`/api/v1/members/${record.id}/commands`, {
        method: "POST",
        headers: mutationHeaders(photoKey.current.key),
        body,
      });
      drafts.clear();
      router.push(`/members/${record.id}`);
    } catch (e) {
      setNotice("");
      setError(
        `O cadastro foi criado, mas a foto não foi salva. ${abort.signal.aborted ? "O envio foi interrompido; tente novamente." : e instanceof Error ? e.message : "Tente novamente."}`,
      );
    } finally {
      window.clearTimeout(timeout);
      controller.current = null;
      setBusy(false);
    }
  }
  return (
    <section className={`panel ${styles.root}`}>
      <h2>Dados do associado</h2>
      <p>Este cadastro não cria login nem concede benefícios automaticamente.</p>
      {error && <p role="alert">{error}</p>}
      {canUpload && (
        <NewMemberPhoto
          file={file}
          disabled={busy}
          onChange={(next) => {
            setFile(next);
            prepared.current = null;
            uploadKey.current = crypto.randomUUID();
          }}
        />
      )}
      <p role="status" aria-live="polite">
        {notice}
      </p>
      {created ? (
        <div className={styles.actions}>
          <Button
            intent="primary"
            disabled={busy || !file}
            onClick={() => void finishPhoto(created)}
          >
            Tentar salvar foto novamente
          </Button>
          <Button disabled={busy} onClick={() => router.push(`/members/${created.id}`)}>
            Abrir cadastro
          </Button>
        </div>
      ) : (
        <ProfileForm
          disabled={busy}
          onSave={async (profile) => {
            setBusy(true);
            setError("");
            const body = JSON.stringify({ profile });
            if (retry.current.body !== body) retry.current = { body, key: crypto.randomUUID() };
            try {
              const record = await memberRequest<MemberRecord>("/api/v1/members", {
                method: "POST",
                headers: mutationHeaders(retry.current.key),
                body,
              });
              setCreated(record);
              await finishPhoto(record);
              return true;
            } catch (e) {
              setError(e instanceof Error ? e.message : "Falha ao cadastrar.");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </section>
  );
}
