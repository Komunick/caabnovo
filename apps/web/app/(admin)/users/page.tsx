import Link from "next/link";
import { headers } from "next/headers";
import { Plus, Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { listUsers } from "@caab/db/repositories/users";
import { listActiveRoles } from "@caab/db/repositories/roles";
import { userListQuerySchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { getDatabase } from "@/modules/shared/database";
import { UserFilters } from "@/modules/users/ui/user-filters";
import { Table, TableContainer } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

export default async function UsersPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const requestHeaders = await headers();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/users", { headers: requestHeaders }),
  );
  if (!actor?.permissions.has(PERMISSIONS.usersRead)) {
    return <p role="alert">Você não tem permissão para acessar colaboradores.</p>;
  }
  const raw = await searchParams;
  const parsed = userListQuerySchema.safeParse({
    ...raw,
    status: raw.status || undefined,
    limit: 100,
  });
  const query = parsed.success ? parsed.data : userListQuerySchema.parse({ limit: 100 });
  const database = getDatabase();
  const page = await listUsers(database.pool, query);
  const roles = actor.permissions.has(PERMISSIONS.rolesRead)
    ? await listActiveRoles(database.pool)
    : [];
  const pageLink = (cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (query.q) params.set("q", query.q);
    if (query.status) params.set("status", query.status);
    if (query.deleted !== "excluded") params.set("deleted", query.deleted);
    if (query.roleId) params.set("roleId", query.roleId);
    if (query.createdFrom) params.set("createdFrom", query.createdFrom);
    if (query.createdTo) params.set("createdTo", query.createdTo);
    return `/users${params.size ? `?${params}` : ""}`;
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Controle de acesso</p>
        <h1>Colaboradores</h1>
        <p>Contas internas, estado atual e funções efetivas.</p>
        <div className="module-header-actions">
          {actor.permissions.has("exports:generate") && (
            <Link className={buttonVariants()} href="/users/exportar">
              <Download size={18} aria-hidden="true" /> Exportar colaboradores
            </Link>
          )}
          {actor.permissions.has(PERMISSIONS.usersCreate) && (
            <Link className={buttonVariants({ intent: "primary", size: "add" })} href="/users/new">
              <Plus aria-hidden="true" /> Novo colaborador
            </Link>
          )}
        </div>
      </header>
      <section className="panel" aria-labelledby="user-list-title">
        <h2 id="user-list-title">Contas cadastradas</h2>
        <UserFilters query={query} roles={roles.map(({ id, name }) => ({ id, name }))} />
        {!parsed.success ? (
          <p role="alert">A página solicitada é inválida. Exibindo a primeira página.</p>
        ) : null}
        {page.items.length === 0 ? <p>Nenhuma conta encontrada nesta página.</p> : null}
        <TableContainer aria-label="Tabela de contas; use as setas para percorrer horizontalmente">
          <Table caption="Contas cadastradas">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">E-mail</th>
                <th scope="col">Estado</th>
                {actor.permissions.has(PERMISSIONS.rolesRead) ? <th scope="col">Funções</th> : null}
              </tr>
            </thead>
            <tbody>
              {page.items.map((user) => (
                <tr key={user.id} className="linked-table-row">
                  <th scope="row">
                    <Link className="linked-table-row__link" href={`/users/${user.id}`}>
                      {user.name}
                    </Link>
                  </th>
                  <td>{user.email}</td>
                  <td>
                    {user.deletionEffectiveAt
                      ? user.deletionEffectiveAt.getTime() <= Date.now()
                        ? "Excluído"
                        : "Exclusão pendente — bloqueado"
                      : user.status === "active"
                        ? "Ativo"
                        : "Desativado"}
                  </td>
                  {actor.permissions.has(PERMISSIONS.rolesRead) ? (
                    <td>{user.roles.map(({ name }) => name).join(", ") || "Sem função"}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
        <Pagination
          firstHref={query.cursor ? pageLink() : undefined}
          nextHref={page.nextCursor ? pageLink(page.nextCursor) : undefined}
        />
      </section>
    </div>
  );
}
