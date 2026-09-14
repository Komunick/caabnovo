import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import Link from "next/link";
import { NewPartner } from "@/modules/partners/ui/new-partner";
import { buttonVariants } from "@/components/ui/button";
export const metadata = { title: "Novo parceiro", robots: { index: false, follow: false } };
export default async function NewPartnerPage() {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/partners", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("partners:read") || !actor.permissions.has("partners:write"))
    return <p role="alert">Você não tem permissão para cadastrar parceiros.</p>;
  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Rede conveniada</p>
        <h1>Novo parceiro</h1>
        <p>Preencha os dados de identificação e contato.</p>
        <Link className={buttonVariants({ size: "compact" })} href="/partners">
          Voltar à lista
        </Link>
      </header>
      <NewPartner />
    </div>
  );
}
