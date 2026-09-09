import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { idSchema, newsChannelSchema } from "@caab/contracts";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { readPublicNewsPage } from "@/modules/news/public-service";
import { NewsPolicyError } from "@/modules/news/errors";
import { NewsArticle } from "@/modules/news/ui/news-article";

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
        <NewsArticle
          id={published.id}
          metadata={published}
          body={published.body}
          date={published.publishedAt}
          channel={channel.data}
          availableFileIds={availableFileIds}
          heading="h1"
        />
      </main>
    );
  } catch (error) {
    if (error instanceof NewsPolicyError && error.status === 404) notFound();
    throw error;
  }
}
