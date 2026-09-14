import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { idSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { getPartner, PartnerError } from "@/modules/partners/partner-service";
import { PartnerEditor } from "@/modules/partners/ui/partner-editor";
export const metadata = { title: "Cadastro de parceiro", robots: { index: false, follow: false } };
export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = idSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/partners", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("partners:read"))
    return <p role="alert">Você não tem permissão para acessar parceiros.</p>;
  try {
    return (
      <PartnerEditor
        initial={await getPartner(getDatabase().pool, actor, parsed.data)}
        canReadFiles={actor.permissions.has("files:read")}
        canUpload={actor.permissions.has("files:create") && actor.permissions.has("partners:write")}
        canWrite={actor.permissions.has("partners:write")}
        canPublish={actor.permissions.has("partners:publish")}
      />
    );
  } catch (error) {
    if (error instanceof PartnerError && error.status === 404) notFound();
    throw error;
  }
}
