"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function SensitiveActionDialog({
  triggerLabel,
  title,
  fieldLabel,
  confirmLabel,
  onConfirm,
}: Readonly<{
  triggerLabel: string;
  title: string;
  fieldLabel: string;
  confirmLabel: string;
  onConfirm(reason: string): Promise<void>;
}>) {
  const fieldId = useId();
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setHydrated(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "");
    try {
      await onConfirm(reason);
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
      <DialogContent title={title} description="Confirme esta ação sensível com uma justificativa.">
        <form onSubmit={submit}>
          <div className="form-field">
            <label htmlFor={fieldId}>{fieldLabel}</label>
            <textarea id={fieldId} name="reason" required rows={3} />
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <div className="button-row">
            <DialogClose asChild>
              <Button disabled={pending}>Cancelar</Button>
            </DialogClose>
            <Button intent="danger" type="submit" disabled={pending}>
              {pending ? "Aguarde…" : confirmLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
