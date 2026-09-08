import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { idSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { auditExportDownloadUrl, findAuditExport } from "@/modules/audit/audit-export-service";

const labels = {
  queued: "Na fila",
  running: "Em processamento",
  succeeded: "Concluída",
  failed: "Falhou",
} as const;

export default async function AuditExportPage({
  params,
}: Readonly<{ params: Promise<{ jobId: string }> }>) {
  const { jobId: untrustedJobId } = await params;
  const parsed = idSchema.safeParse(untrustedJobId);
  if (!parsed.success) notFound();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/audit/exports", { headers: await headers() }),
  );
  if (!actor) notFound();
  const job = await findAuditExport(getDatabase().pool, actor, parsed.data);
  if (!job) notFound();
  const downloadUrl = job.object_key ? await auditExportDownloadUrl(job.object_key) : null;

  return (
    <div className="page-stack">
      <header>
        <p className="eyebrow">Arquivo privado temporário</p>
        <h1>Exportação de auditoria</h1>
      </header>
      <section className="panel" aria-labelledby="audit-export-status-title">
        <h2 id="audit-export-status-title">{labels[job.status]}</h2>
        <p>Progresso: {job.progress}%</p>
        {job.safe_error_message ? <p role="alert">{job.safe_error_message}</p> : null}
        {downloadUrl ? (
          <p>
            <a href={downloadUrl}>Baixar exportação</a> — o endereço expira em cinco minutos.
          </p>
        ) : (
          <p>Atualize esta página para acompanhar o processamento.</p>
        )}
        <Link href="/audit">Voltar para auditoria</Link>
      </section>
    </div>
  );
}
