import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { idSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { findAuthorizedJob } from "@/modules/jobs/job-service";
import { JobAutoRefresh } from "@/modules/jobs/ui/job-auto-refresh";
import { RedriveDialog } from "@/modules/jobs/ui/redrive-dialog";
import { getDatabase } from "@/modules/shared/database";

const statusLabel = {
  queued: "Na fila",
  running: "Em andamento",
  succeeded: "Concluído",
  failed: "Falhou",
} as const;

export default async function JobPage({
  params,
}: Readonly<{ params: Promise<{ jobId: string }> }>) {
  const requestHeaders = await headers();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/audit/jobs", { headers: requestHeaders }),
  );
  if (!actor?.permissions.has(PERMISSIONS.jobsRead)) {
    return <p role="alert">Você não tem permissão para acessar este processamento.</p>;
  }
  const parsedId = idSchema.safeParse((await params).jobId);
  if (!parsedId.success) notFound();
  const job = await findAuthorizedJob(getDatabase().pool, actor, parsedId.data);
  if (!job) notFound();
  const active = job.status === "queued" || job.status === "running";

  return (
    <div className="page-stack">
      <JobAutoRefresh active={active} />
      <header>
        <p className="eyebrow">Detalhe operacional</p>
        <h1>{job.jobType}</h1>
        <p>
          <Link href="/audit/jobs">Voltar aos processamentos</Link>
        </p>
      </header>
      <section className="panel" aria-labelledby="job-status-title">
        <h2 id="job-status-title">Estado: {statusLabel[job.status]}</h2>
        <label htmlFor="job-progress">Progresso</label>
        <progress id="job-progress" max={100} value={job.progress}>
          {job.progress}%
        </progress>
        <p aria-live="polite">{job.progress}% concluído</p>
        <dl className="audit-metadata">
          <dt>Identificador</dt>
          <dd>{job.id}</dd>
          <dt>Tentativas</dt>
          <dd>{job.attemptCount}</dd>
          <dt>Correlação</dt>
          <dd>{job.correlationId}</dd>
        </dl>
        {job.status === "failed" ? (
          <div className="job-failure" role="alert">
            <h3>Falha terminal</h3>
            <p>{job.safeErrorMessage ?? "O processamento não pôde ser concluído."}</p>
            {actor.permissions.has(PERMISSIONS.jobsRedrive) ? (
              <RedriveDialog jobId={job.id} />
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
