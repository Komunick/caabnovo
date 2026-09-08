"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function RedriveDialog({ jobId }: Readonly<{ jobId: string }>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/v1/jobs/${jobId}/redrive`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": crypto.randomUUID() },
      body: JSON.stringify({ reason: form.get("reason") }),
    });
    if (!response.ok) {
      setError("Não foi possível reenviar o processamento.");
      setPending(false);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button intent="primary">Reenviar processamento</Button>
      </DialogTrigger>
      <DialogContent
        title="Reenviar processamento"
        description="Uma nova tentativa será auditada e manterá a mesma chave idempotente."
      >
        <form onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="redrive-reason">Justificativa</label>
            <textarea id="redrive-reason" name="reason" minLength={1} maxLength={500} required />
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <div className="button-row">
            <DialogClose asChild>
              <Button disabled={pending}>Cancelar</Button>
            </DialogClose>
            <Button intent="primary" type="submit" disabled={pending}>
              {pending ? "Reenviando…" : "Confirmar reenvio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
