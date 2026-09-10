import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { memberListSchema, memberDimensions } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { listMembers } from "@/modules/members/member-service";
import { resultLabels } from "@/modules/members/ui/labels";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableContainer } from "@/components/ui/table";
import styles from "@/modules/members/ui/members.module.css";
export const metadata = { title: "Associados", robots: { index: false, follow: false } };
export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/members", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("members:read"))
    return <p role="alert">Você não tem permissão para acessar associados.</p>;
  const raw = await searchParams;
  const parsed = memberListSchema.safeParse({
    ...raw,
    ...(raw.registrationStatus === "" ? { registrationStatus: undefined } : {}),
  });
  const query = parsed.success ? parsed.data : memberListSchema.parse({});
  const result = await listMembers(getDatabase().pool, actor, query);
  const pageLink = (page: number) =>
    `/members?${new URLSearchParams({ q: query.q, archived: query.archived, registrationStatus: query.registrationStatus ?? "", page: String(page) })}`;
  return (
    <div className={`page-stack ${styles.root}`}>
      <header className="page-header">
        <p className="eyebrow">Pessoas</p>
        <h1>Associados</h1>
        <p>Cadastros, dependentes e análises em um só lugar.</p>
        {actor.permissions.has("members:write") && (
          <Link className={buttonVariants({ intent: "primary" })} href="/members/new">
            Novo associado
          </Link>
        )}
      </header>
      <section className="panel">
        <h2>Encontrar cadastro</h2>
        {!parsed.success && <p role="alert">Filtros inválidos. Exibindo a primeira página.</p>}
        <form action="/members">
          <div className={styles.grid}>
            <div className="form-field">
              <label htmlFor="member-search">Nome, CPF ou inscrição OAB</label>
              <input id="member-search" name="q" maxLength={160} defaultValue={query.q} />
            </div>
            <div className="form-field">
              <label htmlFor="member-filter">Análise cadastral</label>
              <select
                id="member-filter"
                name="registrationStatus"
                defaultValue={query.registrationStatus ?? ""}
              >
                <option value="">Todas as situações</option>
                {memberDimensions.registration.map((r) => (
                  <option key={r} value={r}>
                    {resultLabels[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="member-archived">Exibir</label>
              <select id="member-archived" name="archived" defaultValue={query.archived}>
                <option value="active">Não arquivados</option>
                <option value="archived">Arquivados</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </div>
          <Button type="submit">Filtrar cadastros</Button>
        </form>
        {!result.items.length ? (
          <p>Nenhum cadastro encontrado. Ajuste a busca ou crie uma pessoa.</p>
        ) : (
          <TableContainer aria-label="Lista de associados">
            <Table caption="Pessoas e análise cadastral">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Análise</th>
                  <th scope="col">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/members/${m.id}`}>{m.name}</Link>
                    </td>
                    <td>{resultLabels[m.registrationStatus]}</td>
                    <td>{m.archivedAt ? "Arquivado" : "Não arquivado"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
        <nav className={styles.actions} aria-label="Paginação de associados">
          {result.page > 1 && <Link href={pageLink(result.page - 1)}>Página anterior</Link>}
          <span>Página {result.page}</span>
          {result.hasNextPage && <Link href={pageLink(result.page + 1)}>Próxima página</Link>}
        </nav>
      </section>
    </div>
  );
}
