import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { idSchema, oabNumberSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { getMember, MemberError } from "@/modules/members/member-service";
import { MemberNavigation } from "@/modules/members/ui/member-navigation";
import { OabLookup } from "@/modules/members/ui/oab-lookup";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Consulta OAB", robots: { index: false, follow: false } };
export default async function OabPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string | string[] }>;
}) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/members/oab", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has("members:read"))
    return <p role="alert">Você não tem permissão para consultar associados.</p>;
  const { memberId } = await searchParams;
  let member;
  if (memberId !== undefined) {
    const parsed = idSchema.safeParse(memberId);
    if (!parsed.success) notFound();
    const record = await getMember(getDatabase().pool, actor, parsed.data).catch(
      (error: unknown) => {
        if (error instanceof MemberError && error.code === "MEMBER_NOT_FOUND") notFound();
        throw error;
      },
    );
    member = {
      id: record.id,
      name: record.profile.socialName || record.profile.name,
      number: record.profile.oab?.number ?? "",
      compatible:
        record.profile.oab?.state === "BA" &&
        record.profile.oab.type === "lawyer" &&
        oabNumberSchema.safeParse(record.profile.oab.number).success,
    };
  }
  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Associados</p>
        <h1>Consulta OAB</h1>
        <p>Consulte a regularidade de uma inscrição na fonte institucional.</p>
        {member && (
          <Link href={`/members/${member.id}`} className={buttonVariants({ size: "compact" })}>
            Voltar ao associado
          </Link>
        )}
      </header>
      <MemberNavigation active="oab" />
      <OabLookup key={member?.id ?? "standalone"} member={member} />
    </div>
  );
}
