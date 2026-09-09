import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { newsListQuerySchema } from "@caab/contracts";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { listNewsDrafts } from "@/modules/news/news-service";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableContainer } from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Notícias", robots: { index: false, follow: false } };

export default async function NewsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>) {
  const actor = await resolveRequestActor(
    new Request("http://caab.internal/news", { headers: await headers() }),
  );
  if (!actor) redirect("/login");
  const parsed = newsListQuerySchema.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : newsListQuerySchema.parse({});
  const result = await listNewsDrafts(await getNewsPayload(), actor, query);
  const href = (page: number) => `/news?${new URLSearchParams({ ...query, page: String(page) })}`;
  return (
    <div className="page-stack">
      <header className="page-header">
        <p className="eyebrow">Comunicação</p>
        <h1>Notícias</h1>
        <p>Prepare o conteúdo e acompanhe suas revisões editoriais.</p>
        <Link className={buttonVariants({ intent: "primary" })} href="/news/new">
          Nova notícia
        </Link>
      </header>
      <section className="panel" aria-labelledby="news-list-title">
        <h2 id="news-list-title">Conteúdo editorial</h2>
        {!parsed.success ? (
          <p role="alert">Filtros inválidos. Exibindo a primeira página.</p>
        ) : null}
        <form className="news-filters" action="/news">
          <div className="form-field">
            <label htmlFor="news-search">Buscar pelo título</label>
            <input id="news-search" name="search" defaultValue={query.search} maxLength={200} />
          </div>
          <div className="form-field">
            <label htmlFor="news-state">Estado</label>
            <select id="news-state" name="state" defaultValue={query.state}>
              <option value="active">Ativas</option>
              <option value="archived">Arquivadas</option>
              <option value="all">Todas</option>
            </select>
          </div>
          <Button type="submit">Filtrar</Button>
        </form>
        {result.items.length === 0 ? (
          <p>Nenhuma notícia encontrada. Crie um rascunho ou ajuste os filtros.</p>
        ) : (
          <TableContainer aria-label="Lista de notícias">
            <Table caption="Notícias e revisão atual">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Revisão</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Atualizada em (Brasília)</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id}>
                    <th scope="row">
                      <Link href={`/news/${item.id}`}>{item.metadata.title || "Sem título"}</Link>
                    </th>
                    <td>{item.revision}</td>
                    <td>{item.archived ? "Arquivada" : "Ativa"}</td>
                    <td>
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Sao_Paulo",
                      }).format(new Date(item.updatedAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        )}
        <Pagination
          previousHref={result.page > 1 ? href(result.page - 1) : undefined}
          nextHref={result.page < result.totalPages ? href(result.page + 1) : undefined}
        />
      </section>
    </div>
  );
}
