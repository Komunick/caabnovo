import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { idSchema, newsChannelSchema } from "@caab/contracts";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { readPublicNewsPage } from "@/modules/news/public-service";
import { NewsPolicyError } from "@/modules/news/errors";
import { NewsBodyView } from "@/modules/news/ui/news-body";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notícias — CAAB", description: "Notícias da CAAB" };
export default async function PublicNewsPage({
  params,
}: Readonly<{ params: Promise<{ channel: string; newsId: string; slug?: string }> }>) {
  const input = await params;
  const channel = newsChannelSchema.safeParse(input.channel),
    id = idSchema.safeParse(input.newsId);
  if (!channel.success || !id.success) notFound();
  try {
    const { published, availableFileIds } = await readPublicNewsPage(
      await getNewsPayload(),
      channel.data,
      id.data,
    );
    if (input.slug !== published.slug)
      redirect(`/content/${channel.data}/news/${published.id}/${published.slug}`);
    return (
      <main id="main-content" className="public-news page-stack">
        <header>
          <Link href={`/content/${channel.data}/news`}>Todas as notícias</Link>
        </header>
        <article className="panel news-preview">
          {published.category ? <p>{published.category}</p> : null}
          <h1>{published.title}</h1>
          <p>
            <time dateTime={published.publishedAt}>
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
                timeZone: "America/Sao_Paulo",
              }).format(new Date(published.publishedAt))}
            </time>
          </p>
          {published.cover && availableFileIds.includes(published.cover.fileId) ? (
            <img
              className="news-cover-image"
              src={`/api/v1/content/${channel.data}/news/${published.id}/media/${published.cover.fileId}`}
              alt={published.cover.alt}
            />
          ) : null}
          {published.summary ? <p>{published.summary}</p> : null}
          <NewsBodyView
            body={published.body}
            newsId={published.id}
            channel={channel.data}
            availableFileIds={availableFileIds}
          />
          {published.tags.length ? <p>Assuntos: {published.tags.join(", ")}</p> : null}
        </article>
      </main>
    );
  } catch (error) {
    if (error instanceof NewsPolicyError && error.status === 404) notFound();
    throw error;
  }
}
