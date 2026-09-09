import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { idSchema, newsBodyImages } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getNewsDraft } from "@/modules/news/news-service";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { NewsPolicyError } from "@/modules/news/errors";
import { NewsBodyView } from "@/modules/news/ui/news-body";
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
    const coverAvailable =
      !!draft.metadata.cover && availableFileIds.includes(draft.metadata.cover.fileId);
    return (
      <div className="page-stack">
        <header className="page-header">
          <Link href={`/news/${draft.id}`}>Voltar ao editor</Link>
          <h1>Prévia privada</h1>
          <p>Rascunho · revisão {draft.revision}. Esta visualização não publica o conteúdo.</p>
          <p>
            Destinos previstos:{" "}
            {draft.metadata.channels
              .map((channel) => (channel === "app" ? "Aplicativo" : "Site"))
              .join(", ") || "Ainda não escolhidos"}
          </p>
        </header>
        <article className="panel news-preview">
          <h2>{draft.metadata.title || "Sem título"}</h2>
          {draft.metadata.cover ? (
            coverAvailable ? (
              <img
                className="news-cover-image"
                src={`/api/v1/news/${draft.id}/media/${draft.metadata.cover.fileId}`}
                alt={draft.metadata.cover.alt || "Capa sem descrição; complete antes de publicar"}
              />
            ) : (
              <p role="status">A capa ainda não está disponível para visualização.</p>
            )
          ) : null}
          {draft.metadata.summary ? <p>{draft.metadata.summary}</p> : null}
          <NewsBodyView body={draft.body} newsId={draft.id} availableFileIds={availableFileIds} />
        </article>
      </div>
    );
  } catch (error) {
    if (error instanceof NewsPolicyError && error.status === 404) notFound();
    throw error;
  }
}
