import Link from "next/link";
import { AuditNavigation } from "@/modules/audit/ui/audit-navigation";
import { headers } from "next/headers";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { listAuthorizedJobs } from "@/modules/jobs/job-service";
import { getDatabase } from "@/modules/shared/database";
import { Table, TableContainer } from "@/components/ui/table";

const statusLabel = {
  queued: "Na fila",
  running: "Em andamento",
  succeeded: "Concluído",
  failed: "Falhou",
} as const;

export default async function JobsPage() {
  const requestHeaders = await headers();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/audit/jobs", { headers: requestHeaders }),
  );
  if (!actor?.permissions.has(PERMISSIONS.jobsRead)) {
    return <p role="alert">Você não tem permissão para acessar processamentos.</p>;
  }
  const jobs = await listAuthorizedJobs(getDatabase().pool, actor);

  return (
    <div className="page-stack">
      <header>
        <p className="eyebrow">Saúde operacional</p>
        <h1>Processamentos</h1>
        <p>Acompanhe filas, progresso, tentativas e falhas apresentadas de forma segura.</p>
      </header>
      <AuditNavigation
        events={actor.permissions.has(PERMISSIONS.auditRead)}
        jobs={actor.permissions.has(PERMISSIONS.jobsRead)}
      />
      <section className="panel" aria-labelledby="job-list-title">
        <h2 id="job-list-title">Execuções recentes</h2>
        {jobs.length === 0 ? <p>Nenhum processamento foi iniciado.</p> : null}
        {jobs.length > 0 ? (
          <TableContainer aria-label="Tabela de processamentos recentes">
            <Table caption="Processamentos recentes">
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Progresso</th>
                  <th scope="col">Tentativas</th>
                  <th scope="col">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <th scope="row">
                      <Link href={`/audit/jobs/${job.id}`}>{job.jobType}</Link>
                    </th>
                    <td>
                      <span className={`status-badge status-${job.status}`}>
                        {statusLabel[job.status]}
                      </span>
                    </td>
                    <td>{job.progress}%</td>
                    <td>{job.attemptCount}</td>
                    <td>{new Date(job.createdAt).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        ) : null}
      </section>
    </div>
  );
}
