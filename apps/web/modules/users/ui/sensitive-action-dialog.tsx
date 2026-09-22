"use client";
import { DraftForm, DraftTextarea } from "@/components/ui/draft-controls";
import { FormField } from "@/components/ui/form-field";
import { useDraftCache, useDraftState } from "@/components/workspace-drafts";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function SensitiveActionDialog({
  triggerLabel,
  title,
  confirmLabel,
  onConfirm,
  requireReason = false,
  errorMessage,
  intent = "danger",
  description = "Confirme para concluir esta ação.",
}: Readonly<{
  triggerLabel: string;
  title: string;
  confirmLabel: string;
  description?: string;
  requireReason?: boolean;
  errorMessage?(error: unknown): string;
  intent?: "danger" | "secondary" | "neutral";
  onConfirm(reason: string): Promise<void>;
}>) {
  const drafts = useDraftCache();
  const draftKey = `sensitive-action:${title}`;
  const [reason, setReason] = useDraftState(`${draftKey}:reason`, "");
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setHydrated(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (requireReason && !reason.trim()) {
      setError("Informe o motivo da exclusão.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await onConfirm(reason.trim());
      setReason("");
      drafts.clear(`${draftKey}:`);
      setOpen(false);
    } catch (error) {
      setError(errorMessage?.(error) ?? "Não foi possível concluir a ação.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) {
          setReason("");
          drafts.clear(`${draftKey}:`);
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button intent={intent} disabled={!hydrated}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent title={title} description={description}>
        <DraftForm draftKey={draftKey} onSubmit={submit}>
          {requireReason && (
            <FormField id={`${draftKey}-reason`} label="Motivo da exclusão">
              <DraftTextarea
                name="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                maxLength={1000}
                disabled={pending}
              />
            </FormField>
          )}
          {error ? <p role="alert">{error}</p> : null}
          <div className="button-row">
            <DialogClose asChild>
              <Button disabled={pending}>Cancelar</Button>
            </DialogClose>
            <Button intent={intent} type="submit" disabled={pending}>
              {pending ? "Aguarde…" : confirmLabel}
            </Button>
          </div>
        </DraftForm>
      </DialogContent>
    </Dialog>
  );
}
