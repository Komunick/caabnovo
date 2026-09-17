import { headers } from "next/headers";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { listActiveRoles } from "@caab/db/repositories/roles";
import { findUserById } from "@caab/db/repositories/users";
import { roleSchema, userSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { getDatabase } from "@/modules/shared/database";
import { serializeUser } from "@/modules/users/user-service";
import { RoleAssignmentForm } from "@/modules/users/ui/role-assignment-form";
import { UserForm } from "@/modules/users/ui/user-form";
import { UserAccessForm } from "@/modules/users/ui/user-access-form";
import { readUserAccess } from "@caab/db/repositories/user-access";
import {
  hasUserPassword,
  INITIAL_PASSWORD_PERMISSIONS,
} from "@/modules/users/initial-password-service";
import { InitializePasswordForm } from "@/modules/users/ui/initial-password";

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
  const [record, roleRecords, access, hasPassword] = await Promise.all([
    findUserById(database.pool, userId),
    listActiveRoles(database.pool),
    readUserAccess(database.pool, userId),
    hasUserPassword(database.pool, userId),
  ]);
  if (!record) return <p role="alert">Colaborador não encontrado.</p>;
  const user = userSchema.parse(serializeUser(record));
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
        <p className="eyebrow">Conta interna</p>
        <h1>{user.name}</h1>
        <Link href="/users" className={buttonVariants()}>
          Voltar para colaboradores
        </Link>
        <p>{user.email}</p>
        <span className={`status-badge status-${user.status}`}>
          {user.status === "active" ? "Ativo" : "Desativado"}
        </span>
      </header>
      {!hasPassword &&
      user.status === "active" &&
      actor.userId !== user.id &&
      INITIAL_PASSWORD_PERMISSIONS.every((permission) => actor.permissions.has(permission)) &&
      access.permissions.every((permission) => actor.permissions.has(permission)) ? (
        <InitializePasswordForm userId={user.id} email={user.email} />
      ) : null}
      {actor.permissions.has(PERMISSIONS.usersUpdate) ? (
        <UserForm
          mode="edit"
          user={user}
          canDisable={actor.permissions.has(PERMISSIONS.usersDisable)}
        />
      ) : null}
      <UserAccessForm
        userId={user.id}
        initial={access}
        authority={[...actor.permissions]}
        self={actor.userId === user.id}
        active={user.status === "active"}
      />
      {access.version === 0 ? (
        <RoleAssignmentForm
          userId={user.id}
          roles={roles}
          assignedRoles={user.roles}
          canGrant={actor.permissions.has(PERMISSIONS.rolesGrant)}
          canRevoke={actor.permissions.has(PERMISSIONS.rolesRevoke)}
        />
      ) : null}
    </div>
  );
}
