"use client";
import { DraftForm } from "@/components/ui/draft-controls";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function SensitiveActionDialog({
  triggerLabel,
  title,
  confirmLabel,
  onConfirm,
}: Readonly<{
  triggerLabel: string;
  title: string;
  confirmLabel: string;
  onConfirm(): Promise<void>;
}>) {
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setHydrated(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      setError("Não foi possível concluir a ação.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button intent="danger" disabled={!hydrated}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent title={title} description="Confirme para concluir esta ação.">
        <DraftForm draftKey="users-sensitive-action-dialog-1" onSubmit={submit}>
          {error ? <p role="alert">{error}</p> : null}
          <div className="button-row">
            <DialogClose asChild>
              <Button disabled={pending}>Cancelar</Button>
            </DialogClose>
            <Button intent="danger" type="submit" disabled={pending}>
              {pending ? "Aguarde…" : confirmLabel}
            </Button>
          </div>
        </DraftForm>
      </DialogContent>
    </Dialog>
  );
}
