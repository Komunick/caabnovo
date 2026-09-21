import Link from "next/link";
import { headers } from "next/headers";
import { listActiveRoles } from "@caab/db/repositories/roles";
import { listUsers } from "@caab/db/repositories/users";
import { roleSchema, userListQuerySchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { getDatabase } from "@/modules/shared/database";
import { UserForm } from "@/modules/users/ui/user-form";
import { Table, TableContainer } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

export default async function UsersPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ cursor?: string | string[]; deleted?: string | string[] }>;
}>) {
  const requestHeaders = await headers();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/users", { headers: requestHeaders }),
  );
  if (!actor?.permissions.has(PERMISSIONS.usersRead)) {
    return <p role="alert">Você não tem permissão para acessar colaboradores.</p>;
  }
  const parsed = userListQuerySchema.safeParse({
    cursor: (await searchParams).cursor,
    deleted: (await searchParams).deleted,
    limit: 100,
  });
  const query = parsed.success ? parsed.data : userListQuerySchema.parse({ limit: 100 });
  const database = getDatabase();
  const [page, roleRecords] = await Promise.all([
    listUsers(database.pool, query),
    actor.permissions.has(PERMISSIONS.rolesRead) ? listActiveRoles(database.pool) : [],
  ]);
  const roles = roleRecords.map((role) =>
    roleSchema.parse({
      id: role.id,
      code: role.code,
      name: role.name,
      administrative: role.administrative,
      permissions: role.permissions,
    }),
  );

  return (
    <div className="page-stack">
      <header>
        <p className="eyebrow">Controle de acesso</p>
        <h1>Colaboradores</h1>
        <p>Contas internas, estado atual e funções efetivas.</p>
      </header>
      {actor.permissions.has(PERMISSIONS.usersCreate) ? (
        <UserForm mode="create" roles={roles} />
      ) : null}
      <section className="panel" aria-labelledby="user-list-title">
        <h2 id="user-list-title">Contas cadastradas</h2>
        <form method="get" className="button-row">
          <label htmlFor="user-deleted">Exibir colaboradores</label>
          <select id="user-deleted" name="deleted" defaultValue={query.deleted}>
            <option value="excluded">Cadastros atuais</option>
            <option value="only">Excluídos</option>
            <option value="all">Todos</option>
          </select>
          <button type="submit" className="secondary-button">
            Aplicar filtro
          </button>
        </form>
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
                <th scope="col">Funções</th>
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
                  <td>{user.roles.map(({ name }) => name).join(", ") || "Sem função"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
        <Pagination
          firstHref={
            query.cursor
              ? query.deleted === "excluded"
                ? "/users"
                : `/users?deleted=${query.deleted}`
              : undefined
          }
          nextHref={
            page.nextCursor
              ? `/users?cursor=${encodeURIComponent(page.nextCursor)}${query.deleted === "excluded" ? "" : `&deleted=${query.deleted}`}`
              : undefined
          }
        />
      </section>
    </div>
  );
}
