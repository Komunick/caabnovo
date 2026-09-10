import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import Link from "next/link";
import { NewMember } from "@/modules/members/ui/new-member";
export const metadata = { title: "Novo associado", robots: { index: false, follow: false } };
export default async function NewMemberPage() {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/members", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("members:read") || !actor.permissions.has("members:write"))
    return <p role="alert">Você não tem permissão para cadastrar associados.</p>;
  return (
    <div className="page-stack">
      <header className="page-header">
        <h1>Novo associado</h1>
        <Link href="/members">Voltar à lista</Link>
      </header>
      <NewMember />
    </div>
  );
}
