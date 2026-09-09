import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { idSchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getNewsDraft, listNewsVersions } from "@/modules/news/news-service";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { NewsPolicyError } from "@/modules/news/errors";
import { NewsEditor } from "@/modules/news/ui/news-editor";
import { PERMISSIONS } from "@/modules/auth/permissions";

export const metadata = { title: "Editar notícia", robots: { index: false, follow: false } };
export default async function EditNewsPage({
  params,
}: Readonly<{ params: Promise<{ newsId: string }> }>) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/news", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  const id = idSchema.safeParse((await params).newsId);
  if (!id.success) notFound();
  try {
    const payload = await getNewsPayload();
    const draft = await getNewsDraft(payload, actor, id.data);
    const history = await listNewsVersions(payload, actor, id.data);
    return (
      <div className="page-stack">
        <header className="page-header">
          <Link href="/news">Notícias</Link>
          <h1>Editar notícia</h1>
          <p>Salve, confira o conteúdo e consulte as versões anteriores.</p>
        </header>
        <NewsEditor
          key={draft.id}
          initial={draft}
          initialHistory={history}
          canReadMedia={actor.permissions.has(PERMISSIONS.filesRead)}
          canUploadMedia={actor.permissions.has(PERMISSIONS.filesCreate)}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof NewsPolicyError && error.status === 404) notFound();
    throw error;
  }
}
