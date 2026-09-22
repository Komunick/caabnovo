import { headers } from "next/headers";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { listActiveRoles } from "@caab/db/repositories/roles";
import { findUserById } from "@caab/db/repositories/users";
import { roleSchema, userSchema, formatBrazilianAddress } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { getDatabase } from "@/modules/shared/database";
import { serializeUser } from "@/modules/users/user-service";
import { RoleAssignmentForm } from "@/modules/users/ui/role-assignment-form";
import { UserStatusActions } from "@/modules/users/ui/user-status-actions";
import { UserLifecycle } from "@/modules/users/ui/user-lifecycle";
import { UserForm } from "@/modules/users/ui/user-form";
import { UserAccessForm } from "@/modules/users/ui/user-access-form";
import { readRoleBase } from "@caab/db/repositories/user-roles";
import { readUserAccess } from "@caab/db/repositories/user-access";
import {
  hasUserPassword,
  INITIAL_PASSWORD_PERMISSIONS,
} from "@/modules/users/initial-password-service";
import { InitializePasswordForm, ResetPasswordForm } from "@/modules/users/ui/initial-password";

export default async function UserDetailPage({
  params,
}: Readonly<{ params: Promise<{ userId: string }> }>) {
  const { userId } = await params;
  const requestHeaders = await headers();
  const actor = await resolveRequestActor(
    new Request(`http://caab.internal/users/${userId}`, { headers: requestHeaders }),
  );
  if (!actor?.permissions.has(PERMISSIONS.usersRead)) {
    return <p role="alert">Você não tem permissão para acessar colaboradores.</p>;
  }
  const database = getDatabase();
  const [record, roleRecords, access, hasPassword, base] = await Promise.all([
    findUserById(database.pool, userId),
    listActiveRoles(database.pool),
    readUserAccess(database.pool, userId),
    hasUserPassword(database.pool, userId),
    readRoleBase(database.pool, userId),
  ]);
  if (!record) return <p role="alert">Colaborador não encontrado.</p>;
  const user = userSchema.parse(serializeUser(record));
  const roles = roleRecords.map((role) =>
    roleSchema.parse({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      administrative: role.administrative,
      permissions: role.permissions,
    }),
  );

  const accountActions = (
    <div className="user-account-actions">
      {hasPassword &&
      user.status === "active" &&
      actor.userId !== user.id &&
      actor.permissions.has(PERMISSIONS.usersResetPassword) &&
      (!base.administrator || actor.permissions.has(PERMISSIONS.rolesGrant)) ? (
        <ResetPasswordForm userId={user.id} email={user.email} version={user.version} />
      ) : null}
      <UserStatusActions
        user={user}
        canDisable={actor.permissions.has(PERMISSIONS.usersDisable)}
        canReactivate={actor.permissions.has(PERMISSIONS.usersUpdate)}
      />
    </div>
  );

  return (
    <div className="page-stack">
      <header>
        <p className="eyebrow">Conta interna</p>
        <h1>{user.name}</h1>
        <Link href="/users" className={buttonVariants()}>
          Voltar para colaboradores
        </Link>
        <p>{user.email}</p>
        <span className={`status-badge status-${user.status}`}>
          {user.deletionEffectiveAt
            ? Date.parse(user.deletionEffectiveAt) <= Date.now()
              ? "Excluído"
              : "Exclusão em 24 horas — conta bloqueada"
            : user.status === "active"
              ? "Ativo"
              : "Desativado"}
        </span>
      </header>
      {!hasPassword &&
      user.status === "active" &&
      actor.userId !== user.id &&
      INITIAL_PASSWORD_PERMISSIONS.every((permission) => actor.permissions.has(permission)) &&
      access.permissions.every((permission) => actor.permissions.has(permission)) ? (
        <InitializePasswordForm userId={user.id} email={user.email} />
      ) : null}
      {actor.permissions.has(PERMISSIONS.usersUpdate) && !user.deletionEffectiveAt ? (
        <UserForm
          mode="edit"
          user={user}
          canDisable={actor.permissions.has(PERMISSIONS.usersDisable)}
        />
      ) : null}
      {(!actor.permissions.has(PERMISSIONS.usersUpdate) || user.deletionEffectiveAt) && (
        <section className="panel" aria-label="Dados cadastrais">
          <h2>Dados cadastrais</h2>
          <dl>
            <dt>CPF</dt>
            <dd>{user.cpf ?? "Não informado"}</dd>
            <dt>Telefone</dt>
            <dd>{user.phone ?? "Não informado"}</dd>
            <dt>Endereço</dt>
            <dd>
              {user.address
                ? `${formatBrazilianAddress(user.address)} — ${user.address.city}/${user.address.state}${user.address.postalCode ? ` — CEP ${user.address.postalCode}` : ""}`
                : "Não informado"}
            </dd>
          </dl>
        </section>
      )}
      <UserLifecycle
        user={user}
        canDelete={actor.permissions.has(PERMISSIONS.usersDelete)}
        canRestore={actor.permissions.has(PERMISSIONS.usersUpdate)}
      />
      <UserAccessForm
        userId={user.id}
        initial={access}
        basePermissions={base.permissions}
        authority={[...actor.permissions]}
        self={actor.userId === user.id}
        active={user.status === "active"}
      />
      {actor.permissions.has(PERMISSIONS.rolesRead) ? (
        <RoleAssignmentForm
          userId={user.id}
          roles={roles}
          assignedRoles={user.roles}
          canGrant={actor.permissions.has(PERMISSIONS.rolesGrant)}
          canRevoke={actor.permissions.has(PERMISSIONS.rolesRevoke)}
          active={user.status === "active"}
        >
          {accountActions}
        </RoleAssignmentForm>
      ) : (
        <section className="panel" aria-label="Ações da conta">
          {accountActions}
        </section>
      )}
    </div>
  );
}
