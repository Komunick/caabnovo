import Link from "next/link";
import { notFound } from "next/navigation";
import { newsChannelSchema, publicNewsQuerySchema } from "@caab/contracts";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { listPublicNews } from "@/modules/news/public-service";
export const dynamic = "force-dynamic";
export const metadata = { title: "Notícias — CAAB", description: "Notícias da CAAB" };
export default async function PublicNewsList({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ channel: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const channel = newsChannelSchema.safeParse((await params).channel),
    query = publicNewsQuerySchema.safeParse(await searchParams);
  if (!channel.success || !query.success) notFound();
  const result = await listPublicNews(await getNewsPayload(), channel.data, query.data);
  const href = (page: number) =>
    `?${new URLSearchParams({ page: String(page), search: query.data.search })}`;
  return (
    <main id="main-content" className="public-news page-stack">
      <header>
        <h1>Notícias da CAAB</h1>
      </header>
      <form className="news-actions" role="search">
        <label htmlFor="public-search">Buscar notícias</label>
        <input id="public-search" name="search" defaultValue={query.data.search} maxLength={200} />
        <button type="submit">Buscar</button>
      </form>
      {!result.items.length ? (
        <p>Nenhuma notícia encontrada.</p>
      ) : (
        result.items.map((item) => (
          <article key={item.id} className="panel">
            <h2>
              <Link href={`/content/${channel.data}/news/${item.id}`}>{item.title}</Link>
            </h2>
            <p>{item.summary}</p>
          </article>
        ))
      )}
      <nav aria-label="Páginas de notícias" className="news-actions">
        {result.page > 1 ? <Link href={href(result.page - 1)}>Página anterior</Link> : null}
        <span>Página {result.page}</span>
        {result.hasNextPage ? <Link href={href(result.page + 1)}>Próxima página</Link> : null}
      </nav>
    </main>
  );
}
