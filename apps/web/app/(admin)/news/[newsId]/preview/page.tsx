import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { idSchema, newsBodyImages } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getNewsDraft } from "@/modules/news/news-service";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { NewsPolicyError } from "@/modules/news/errors";
import { NewsPreview } from "@/modules/news/ui/news-preview";
import { getUsableNewsMediaIds } from "@/modules/news/media-service";
import { PERMISSIONS } from "@/modules/auth/permissions";

export const metadata = { title: "Prévia privada", robots: { index: false, follow: false } };
export default async function NewsPreviewPage({
  params,
}: Readonly<{ params: Promise<{ newsId: string }> }>) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/news/preview", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  if (!actor.permissions.has(PERMISSIONS.newsRead))
    return <p role="alert">Você não tem permissão para acessar notícias.</p>;
  const id = idSchema.safeParse((await params).newsId);
  if (!id.success) notFound();
  try {
    const draft = await getNewsDraft(await getNewsPayload(), actor, id.data);
    const availableFileIds = actor.permissions.has(PERMISSIONS.filesRead)
      ? await getUsableNewsMediaIds(await getNewsPayload(), actor, draft.id, [
          ...newsBodyImages(draft.body).map((image) => image.fileId!),
          ...(draft.metadata.cover ? [draft.metadata.cover.fileId] : []),
        ])
      : [];
    return (
      <div className="page-stack news-module">
        <header className="page-header">
          <Link
            className={buttonVariants({ size: "compact" })}
            href={actor.permissions.has(PERMISSIONS.newsWrite) ? `/news/${draft.id}` : "/news"}
          >
            {actor.permissions.has(PERMISSIONS.newsWrite)
              ? "Voltar ao editor"
              : "Voltar para notícias"}
          </Link>
          <h1>Prévia privada</h1>
          <p>Rascunho · revisão {draft.revision}. Esta visualização não publica o conteúdo.</p>
          <p>
            Destinos previstos:{" "}
            {draft.metadata.channels
              .map((channel) => (channel === "app" ? "Aplicativo" : "Site"))
              .join(", ") || "Ainda não escolhidos"}
          </p>
        </header>
        <NewsPreview draft={draft} availableFileIds={availableFileIds} />
      </div>
    );
  } catch (error) {
    if (error instanceof NewsPolicyError && error.status === 404) notFound();
    throw error;
  }
}
