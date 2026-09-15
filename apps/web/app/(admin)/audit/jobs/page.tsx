import Link from "next/link";
import Form from "next/form";
import { jobListQuerySchema } from "@caab/contracts";
import { AuditNavigation } from "@/modules/audit/ui/audit-navigation";
import { headers } from "next/headers";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { listAuthorizedJobs } from "@/modules/jobs/job-service";
import { getDatabase } from "@/modules/shared/database";
import { Table, TableContainer } from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

const statusLabel = {
  queued: "Na fila",
  running: "Em andamento",
  succeeded: "Concluído",
  failed: "Falhou",
} as const;

const typeLabel: Record<string, string> = {
  "file-scan": "Verificação de arquivo",
  "audit-export": "Exportação de auditoria",
  "news-publication": "Publicação de notícia",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const requestHeaders = await headers();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/audit/jobs", { headers: requestHeaders }),
  );
  if (!actor?.permissions.has(PERMISSIONS.jobsRead)) {
    return <p role="alert">Você não tem permissão para acessar processamentos.</p>;
  }
  const params = await searchParams;
  const selectedType =
    Object.entries(typeLabel).find(([, label]) => label === params.jobType)?.[0] ?? params.jobType;
  const parsed = jobListQuerySchema.safeParse(
    Object.fromEntries(
      ["status", "jobType", "limit", "cursor"].map((key) => [
        key,
        params[key] === "" ? undefined : key === "jobType" ? selectedType : params[key],
      ]),
    ),
  );
  if (!parsed.success) {
    return (
      <div className="page-stack">
        <h1>Processamentos</h1>
        <p role="alert">Os filtros ou a página informada são inválidos. Reinicie a consulta.</p>
        <Link className={buttonVariants()} href="/audit/jobs">
          Reiniciar consulta
        </Link>
      </div>
    );
  }
  const query = parsed.data;
  const { items: jobs, nextCursor } = await listAuthorizedJobs(getDatabase().pool, actor, query);
  const filters = new URLSearchParams({ limit: String(query.limit) });
  if (query.status) filters.set("status", query.status);
  if (query.jobType) filters.set("jobType", query.jobType);
  const firstHref = `/audit/jobs?${filters}`;
  if (nextCursor) filters.set("cursor", nextCursor);

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
      <Form
        action="/audit/jobs"
        className="filter-grid"
        key={JSON.stringify(query)}
        aria-label="Filtros de processamentos"
      >
        <div className="form-field">
          <label htmlFor="job-status">Estado</label>
          <select id="job-status" name="status" defaultValue={query.status ?? ""}>
            <option value="">Todos os estados</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="job-type">Tipo</label>
          <input
            id="job-type"
            name="jobType"
            list="job-types"
            maxLength={100}
            defaultValue={typeLabel[query.jobType ?? ""] ?? query.jobType ?? ""}
            placeholder="Todos os tipos"
          />
          <datalist id="job-types">
            {Object.entries(typeLabel).map(([value, label]) => (
              <option key={value} value={label} />
            ))}
          </datalist>
        </div>
        <input type="hidden" name="limit" value={query.limit} />
        <div className="form-actions">
          <Button type="submit" intent="primary">
            Aplicar filtros
          </Button>
          <Link className={buttonVariants({ intent: "ghost" })} href="/audit/jobs">
            Limpar filtros
          </Link>
        </div>
      </Form>
      <section className="panel" aria-labelledby="job-list-title">
        <h2 id="job-list-title">Execuções</h2>
        <p>
          {jobs.length} {jobs.length === 1 ? "processamento" : "processamentos"} nesta página.
        </p>
        {jobs.length === 0 ? <p>Nenhum processamento encontrado nesta consulta.</p> : null}
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
                      <Link href={`/audit/jobs/${job.id}`}>
                        {typeLabel[job.jobType] ?? job.jobType}
                      </Link>
                    </th>
                    <td>
                      <span className={`status-badge status-${job.status}`}>
                        {statusLabel[job.status]}
                      </span>
                    </td>
                    <td>{job.progress}%</td>
                    <td>{job.attemptCount}</td>
                    <td>
                      {new Date(job.createdAt).toLocaleString("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        ) : null}
        <Pagination
          firstHref={query.cursor ? firstHref : undefined}
          nextHref={nextCursor ? `/audit/jobs?${filters}` : undefined}
        />
      </section>
    </div>
  );
}
