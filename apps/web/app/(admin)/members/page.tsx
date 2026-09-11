import { Plus } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { memberListSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { listMembers } from "@/modules/members/member-service";
import { administrativeStatusLabels, resultLabels } from "@/modules/members/ui/labels";
import { buttonVariants } from "@/components/ui/button";
import { MemberNavigation } from "@/modules/members/ui/member-navigation";
import { Table, TableContainer } from "@/components/ui/table";
import { MemberFilters } from "@/modules/members/ui/member-filters";
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
    ...(raw.oabState === "" ? { oabState: undefined } : {}),
    ...(raw.administrativeStatus === "" ? { administrativeStatus: undefined } : {}),
  });
  const query = parsed.success ? parsed.data : memberListSchema.parse({});
  const result = await listMembers(getDatabase().pool, actor, query);
  const pageLink = (page: number) =>
    `/members?${new URLSearchParams({ q: query.q, archived: query.archived, registrationStatus: query.registrationStatus ?? "", oabState: query.oabState ?? "", administrativeStatus: query.administrativeStatus ?? "", page: String(page) })}`;
  return (
    <div className={`page-stack ${styles.root}`}>
      <header className="page-header">
        <p className="eyebrow">Pessoas</p>
        <h1>Associados</h1>
        <p>Cadastros, dependentes e análises em um só lugar.</p>
        {actor.permissions.has("members:write") && (
          <Link className={buttonVariants({ intent: "primary", size: "add" })} href="/members/new">
            <Plus aria-hidden="true" /> Novo associado
          </Link>
        )}
      </header>
      <MemberNavigation active="members" />
      <section className="panel">
        <h2>Encontrar cadastro</h2>
        {!parsed.success && <p role="alert">Filtros inválidos. Exibindo a primeira página.</p>}
        <MemberFilters query={query} />
        {!result.items.length ? (
          <p>Nenhum cadastro encontrado. Ajuste a busca ou crie uma pessoa.</p>
        ) : (
          <TableContainer aria-label="Lista de associados">
            <Table
              className={styles.memberTable}
              caption="Pessoas, análise e situação administrativa"
            >
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Análise</th>
                  <th scope="col">Situação administrativa</th>
                  <th scope="col">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((m) => (
                  <tr key={m.id} className="linked-table-row">
                    <td>
                      <Link className="linked-table-row__link" href={`/members/${m.id}`}>
                        {m.name}
                      </Link>
                    </td>
                    <td>{resultLabels[m.registrationStatus]}</td>
                    <td>{administrativeStatusLabels[m.administrativeStatus]}</td>
                    <td>{m.archivedAt ? "Arquivado" : "Não arquivado"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
        <nav className={styles.actions} aria-label="Paginação de associados">
          {result.page > 1 && (
            <Link className={buttonVariants()} href={pageLink(result.page - 1)}>
              Página anterior
            </Link>
          )}
          <span>Página {result.page}</span>
          {result.hasNextPage && (
            <Link className={buttonVariants()} href={pageLink(result.page + 1)}>
              Próxima página
            </Link>
          )}
        </nav>
      </section>
    </div>
  );
}
