import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { roleSchema } from "@caab/contracts";
import { listActiveRoles } from "@caab/db/repositories/roles";
import { buttonVariants } from "@/components/ui/button";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { UserForm } from "@/modules/users/ui/user-form";
export const metadata = { title: "Novo colaborador", robots: { index: false, follow: false } };
export default async function NewUserPage() {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/users/new", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("users:read") || !actor.permissions.has("users:create"))
    return <p role="alert">Você não tem permissão para cadastrar colaboradores.</p>;
  const records = actor.permissions.has("roles:read")
    ? await listActiveRoles(getDatabase().pool)
    : [];
  const roles = records.map((role) =>
    roleSchema.parse({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      administrative: role.administrative,
      permissions: role.permissions,
    }),
  );
  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Controle de acesso</p>
        <h1>Novo colaborador</h1>
        <p>Preencha os dados de identificação e contato.</p>
        <Link className={buttonVariants({ size: "compact" })} href="/users">
          Voltar à lista
        </Link>
      </header>
      <UserForm mode="create" roles={roles} />
    </div>
  );
}
