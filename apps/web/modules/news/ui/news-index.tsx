import { Plus } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { newsListQuerySchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { listNewsDrafts } from "@/modules/news/news-service";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { buttonVariants } from "@/components/ui/button";
import { NewsList } from "@/modules/news/ui/news-list";
import { ModuleNavigation } from "@/components/ui/module-navigation";

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
  if (!actor.permissions.has("news:read"))
    return <p role="alert">Você não tem permissão para acessar notícias.</p>;
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
      <header className="page-header">
        <p className="eyebrow">Comunicação</p>
        <h1>{drafts ? "Rascunhos de notícias" : "Notícias"}</h1>
        <p>
          {drafts
            ? "Conteúdos em preparação, ainda não publicados."
            : "Gerencie as notícias publicadas e seu histórico."}
        </p>
        {actor.permissions.has("news:write") && (
          <Link className={buttonVariants({ intent: "primary", size: "add" })} href="/news/new">
            <Plus aria-hidden="true" /> Nova notícia
          </Link>
        )}
      </header>
      <ModuleNavigation
        label="Áreas de notícias"
        items={[
          { href: "/news", label: "Publicadas", active: !drafts },
          { href: "/news/drafts", label: "Rascunhos", active: drafts },
        ]}
      />
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
