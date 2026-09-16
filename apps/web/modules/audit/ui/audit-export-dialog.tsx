"use client";
import { DraftInput, DraftForm } from "@/components/ui/draft-controls";
import { FormField } from "@/components/ui/form-field";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function AuditExportDialog({
  filters,
}: Readonly<{
  filters: { actorId?: string; action?: string; entityType?: string; from?: string; to?: string };
}>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/audit-exports", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": crypto.randomUUID(),
        "idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        ...filters,
        from: new Date(String(data.get("from"))).toISOString(),
        to: new Date(String(data.get("to"))).toISOString(),
      }),
    });
    if (!response.ok) {
      setError("Não foi possível iniciar a exportação.");
      setPending(false);
      return;
    }
    const result = (await response.json()) as { statusUrl: string };
    router.push(result.statusUrl);
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 86_400_000);
  const localValue = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="compact">Exportar auditoria</Button>
      </DialogTrigger>
      <DialogContent
        title="Exportar auditoria"
        description="O arquivo será privado e o endereço de download terá duração limitada."
      >
        <DraftForm draftKey="audit-audit-export-dialog-1" onSubmit={submit}>
          <FormField id="audit-export-from" label="Início">
            <DraftInput
              id="audit-export-from"
              name="from"
              type="datetime-local"
              defaultValue={localValue(filters.from ? new Date(filters.from) : yesterday)}
              required
            />
          </FormField>
          <FormField id="audit-export-to" label="Fim">
            <DraftInput
              id="audit-export-to"
              name="to"
              type="datetime-local"
              defaultValue={localValue(filters.to ? new Date(filters.to) : now)}
              required
            />
          </FormField>

          {error ? <p role="alert">{error}</p> : null}
          <div className="button-row">
            <DialogClose asChild>
              <Button disabled={pending}>Cancelar</Button>
            </DialogClose>
            <Button intent="primary" size="compact" type="submit" disabled={pending}>
              {pending ? "Aguarde…" : "Iniciar exportação"}
            </Button>
          </div>
        </DraftForm>
      </DialogContent>
    </Dialog>
  );
}
