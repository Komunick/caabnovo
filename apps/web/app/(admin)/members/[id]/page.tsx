import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { idSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { getMember, MemberError } from "@/modules/members/member-service";
import { MemberEditor } from "@/modules/members/ui/member-editor";
export const metadata = { title: "Cadastro de associado", robots: { index: false, follow: false } };
export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = idSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/members", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("members:read"))
    return <p role="alert">Você não tem permissão para acessar associados.</p>;
  try {
    return (
      <MemberEditor
        initial={await getMember(getDatabase().pool, actor, parsed.data)}
        canReadFiles={actor.permissions.has("files:read")}
        canUpload={actor.permissions.has("files:create") && actor.permissions.has("members:write")}
        canWrite={actor.permissions.has("members:write")}
        canReview={actor.permissions.has("members:review")}
      />
    );
  } catch (error) {
    if (error instanceof MemberError && error.status === 404) notFound();
    throw error;
  }
}
