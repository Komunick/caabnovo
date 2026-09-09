import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { newsListQuerySchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { listNewsDrafts } from "@/modules/news/news-service";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { buttonVariants } from "@/components/ui/button";
import { NewsList } from "@/modules/news/ui/news-list";

export async function NewsIndex({
  searchParams,
  drafts = false,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  drafts?: boolean;
}>) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/news", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  const parsed = newsListQuerySchema.safeParse({
    ...(await searchParams),
    collection: drafts ? "drafts" : "published",
  });
  const query = parsed.success
    ? parsed.data
    : newsListQuerySchema.parse({ collection: drafts ? "drafts" : "published" });
  const result = await listNewsDrafts(await getNewsPayload(), actor, query);
  return (
    <div className="page-stack news-module">
      <header className="news-list-header">
        <div>
          <h1>{drafts ? "Rascunhos de notícias" : "Notícias"}</h1>
          <p>
            {drafts
              ? "Conteúdos em preparação, ainda não publicados."
              : "Gerencie as notícias publicadas e seu histórico."}
          </p>
        </div>
        <div className="news-list-navigation">
          <Link className={buttonVariants()} href={drafts ? "/news" : "/news/drafts"}>
            {drafts ? "Notícias" : "Rascunhos"}
          </Link>
          <Link className={buttonVariants({ intent: "primary" })} href="/news/new">
            Nova notícia
          </Link>
        </div>
      </header>
      {!parsed.success ? <p role="alert">Filtros inválidos. Exibindo a primeira página.</p> : null}
      <NewsList
        key={JSON.stringify(query)}
        initialResult={result}
        initialQuery={query}
        canReadMedia={actor.permissions.has("files:read")}
      />
    </div>
  );
}
