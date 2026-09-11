"use client";
import Image from "next/image";
import { Camera, Check, Trash2, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MAX_MEMBER_PHOTO_BYTES, type MemberRecord } from "@caab/contracts";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { uploadMemberPhoto, type PreparedPhoto } from "./photo-upload";
import styles from "./members.module.css";

export function isValidMemberPhoto(file: File) {
  return (
    ["image/jpeg", "image/png"].includes(file.type) &&
    /\.(jpe?g|png)$/i.test(file.name) &&
    file.size > 0 &&
    file.size <= MAX_MEMBER_PHOTO_BYTES
  );
}

export function NewMemberPhoto({
  file,
  disabled,
  onChange,
}: {
  file?: File;
  disabled: boolean;
  onChange: (file?: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <section className={styles.photoEditor} aria-labelledby="new-member-photo-title">
      <h3 id="new-member-photo-title">Foto de perfil</h3>
      <p>Opcional · JPEG ou PNG de até 5 MB. A foto será salva junto com o cadastro.</p>
      <div className={styles.photoFields}>
        <div className={styles.photoPreview}>
          <MemberAvatar preview src={preview} />
          <span>{file ? "Prévia · ainda não salva" : "Sem foto"}</span>
        </div>
        <div>
          <input
            ref={input}
            tabIndex={-1}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png"
            aria-label="Selecionar foto de perfil"
            disabled={disabled}
            onChange={(event) => {
              const next = event.target.files?.[0];
              if (next && !isValidMemberPhoto(next)) {
                setError("Escolha uma foto JPEG ou PNG de até 5 MB.");
                onChange(undefined);
              } else {
                setError("");
                onChange(next);
              }
              event.target.value = "";
            }}
          />
          <div className={styles.actions}>
            <Button disabled={disabled} onClick={() => input.current?.click()}>
              <Camera size={18} aria-hidden="true" />
              {file ? "Trocar foto" : "Escolher foto"}
            </Button>
            {file && (
              <Button
                disabled={disabled}
                onClick={() => {
                  onChange(undefined);
                  setError("");
                }}
              >
                <X size={18} aria-hidden="true" />
                Descartar seleção
              </Button>
            )}
          </div>
          {file && <p className={styles.photoFilename}>{file.name}</p>}
          {error && <p role="alert">{error}</p>}
        </div>
      </div>
    </section>
  );
}

export function MemberAvatar({ src, preview = false }: { src?: string; preview?: boolean }) {
  const [failed, setFailed] = useState<string>();
  return (
    <span className={styles.avatar} aria-hidden={preview ? undefined : true}>
      {src && failed !== src ? (
        <Image
          src={src}
          width={112}
          height={112}
          unoptimized
          alt={preview ? "Prévia da foto de perfil" : ""}
          onError={() => setFailed(src)}
        />
      ) : (
        <UserRound size={40} aria-hidden="true" />
      )}
    </span>
  );
}

export function MemberPhoto({
  member,
  canRead,
  canUpload,
  disabled,
  command,
  onBusyChange,
}: {
  member: MemberRecord;
  canRead: boolean;
  canUpload: boolean;
  disabled: boolean;
  command: (input: Record<string, unknown>) => Promise<boolean>;
  onBusyChange: (busy: boolean) => void;
}) {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [committing, setCommitting] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const prepared = useRef<PreparedPhoto | null>(null);
  const uploadKey = useRef(crypto.randomUUID());
  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => controller.current?.abort(), []);

  function select(next?: File) {
    setError("");
    setNotice("");
    if (next && !isValidMemberPhoto(next)) {
      setError("Escolha uma foto JPEG ou PNG de até 5 MB.");
      setFile(undefined);
      prepared.current = null;
      uploadKey.current = crypto.randomUUID();
      return;
    }
    setFile(next);
    prepared.current = null;
    uploadKey.current = crypto.randomUUID();
  }

  async function save(remove = false) {
    if (pending || disabled || reason.trim().length < 3 || (!remove && !file)) return;
    setPending(true);
    onBusyChange(true);
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 120_000);
    try {
      let fileId: string | null = null;
      if (!remove && file) {
        fileId = await uploadMemberPhoto(
          file,
          member.id,
          prepared,
          uploadKey,
          abort.signal,
          setNotice,
        );
      }
      abort.signal.throwIfAborted();
      window.clearTimeout(timeout);
      setCommitting(true);
      setNotice(remove ? "Removendo a foto…" : "Salvando a foto…");
      if (await command({ action: "photo", fileId, justification: reason.trim() })) {
        setFile(undefined);
        prepared.current = null;
        uploadKey.current = crypto.randomUUID();
        setReason("");
        setNotice(remove ? "Foto removida." : "Foto de perfil atualizada.");
      } else setNotice("");
    } catch (e) {
      setNotice("");
      setError(
        abort.signal.aborted
          ? "Envio interrompido. A foto anterior foi preservada; você pode tentar novamente."
          : e instanceof Error
            ? e.message
            : "Não foi possível salvar a foto.",
      );
    } finally {
      window.clearTimeout(timeout);
      controller.current = null;
      setPending(false);
      setCommitting(false);
      onBusyChange(false);
    }
  }
  if (!canRead) return null;
  return (
    <section className={styles.photoEditor} aria-labelledby="member-photo-title">
      <div>
        <h3 id="member-photo-title">Foto de perfil</h3>
        <p>Opcional · JPEG ou PNG de até 5 MB.</p>
      </div>
      <div className={styles.photoFields}>
        <div className={styles.photoPreview}>
          <MemberAvatar
            preview
            src={
              preview ??
              (member.photoFileId
                ? `/api/v1/members/${member.id}/files/${member.photoFileId}`
                : undefined)
            }
          />
          <span>
            {file ? "Prévia · ainda não salva" : member.photoFileId ? "Foto atual" : "Sem foto"}
          </span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {canUpload && (
            <>
              <input
                ref={input}
                tabIndex={-1}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png"
                aria-label="Selecionar foto de perfil"
                disabled={disabled || pending}
                onChange={(event) => {
                  select(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <div className={styles.actions}>
                <Button disabled={disabled || pending} onClick={() => input.current?.click()}>
                  <Camera size={18} aria-hidden="true" />
                  {member.photoFileId ? "Trocar foto" : "Escolher foto"}
                </Button>
                {file && (
                  <Button disabled={disabled || pending} onClick={() => select()}>
                    <X size={18} aria-hidden="true" />
                    Descartar seleção
                  </Button>
                )}
              </div>
              {file && <p className={styles.photoFilename}>{file.name}</p>}
            </>
          )}
          {(!disabled || pending) && (canUpload || member.photoFileId) && (
            <>
              <FormField id="photo-reason" label="Motivo da alteração da foto">
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  required
                  minLength={3}
                  maxLength={1000}
                  disabled={pending}
                  rows={2}
                />
              </FormField>
              <div className={styles.actions}>
                {canUpload && (
                  <Button
                    type="submit"
                    intent="primary"
                    disabled={!file || pending || reason.trim().length < 3}
                  >
                    <Check size={18} aria-hidden="true" />
                    Salvar foto
                  </Button>
                )}
                {member.photoFileId && (
                  <Button
                    disabled={pending || reason.trim().length < 3}
                    onClick={() => void save(true)}
                  >
                    <Trash2 size={18} aria-hidden="true" />
                    Remover foto
                  </Button>
                )}
              </div>
            </>
          )}
          {pending && (
            <Button disabled={committing} onClick={() => controller.current?.abort()}>
              Cancelar envio
            </Button>
          )}
          {error && <p role="alert">{error}</p>}
          <p role="status" aria-live="polite">
            {notice}
          </p>
        </form>
      </div>
    </section>
  );
}
