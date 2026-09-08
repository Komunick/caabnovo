import Link from "next/link";
import { headers } from "next/headers";
import { listActiveRoles } from "@caab/db/repositories/roles";
import { listUsers } from "@caab/db/repositories/users";
import { roleSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { getDatabase } from "@/modules/shared/database";
import { UserForm } from "@/modules/users/ui/user-form";
import { Table, TableContainer } from "@/components/ui/table";

export default async function UsersPage() {
  const requestHeaders = await headers();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/users", { headers: requestHeaders }),
  );
  if (!actor?.permissions.has(PERMISSIONS.usersRead)) {
    return <p role="alert">Você não tem permissão para acessar usuários.</p>;
  }
  const database = getDatabase();
  const [page, roleRecords] = await Promise.all([
    listUsers(database.pool, { limit: 100 }),
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
        <h1>Usuários</h1>
        <p>Contas internas, estado atual e funções efetivas.</p>
      </header>
      {actor.permissions.has(PERMISSIONS.usersCreate) ? (
        <UserForm mode="create" roles={roles} />
      ) : null}
      <section className="panel" aria-labelledby="user-list-title">
        <h2 id="user-list-title">Contas cadastradas</h2>
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
                <tr key={user.id}>
                  <th scope="row">
                    <Link href={`/users/${user.id}`}>{user.name}</Link>
                  </th>
                  <td>{user.email}</td>
                  <td>{user.status === "active" ? "Ativo" : "Desativado"}</td>
                  <td>{user.roles.map(({ name }) => name).join(", ") || "Sem função"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </section>
    </div>
  );
}
