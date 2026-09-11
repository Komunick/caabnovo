import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  WalletCards,
  MessageSquare,
  ChartNoAxesCombined,
  Plus,
  FilePenLine,
  UsersRound,
} from "lucide-react";
import { resolveCurrentUser } from "@/modules/auth/current-user";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getWorkspaceAreas } from "@/modules/workspace/areas";
import { listMembers } from "@/modules/members/member-service";
import { listNewsDrafts } from "@/modules/news/news-service";
import { listLatestPublicNews } from "@/modules/news/public-service";
import { getNewsPayload } from "@/modules/news/payload/runtime";
import { getDatabase } from "@/modules/shared/database";
import { buttonVariants } from "@/components/ui/button";
import { NewsThumbnail } from "@/modules/workspace/ui/news-thumbnail";

const upcoming = [
  {
    name: "Atendimentos",
    description: "Agenda, reservas e próximos atendimentos.",
    icon: CalendarDays,
  },
  { name: "Caassh", description: "Movimentações e acompanhamento de créditos.", icon: WalletCards },
  {
    name: "Mensagens",
    description: "Campanhas e comunicações aos associados.",
    icon: MessageSquare,
  },
  {
    name: "Relatórios",
    description: "Indicadores e resultados de cada área.",
    icon: ChartNoAxesCombined,
  },
];
const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Bahia",
  }).format(new Date(value));

export default async function AdminHomePage() {
  const request = new Request("http://caab.internal/", { headers: await headers() });
  const [identity, actor] = await Promise.all([
    resolveCurrentUser(request),
    resolveRequestActor(request),
  ]);
  if (!identity || !actor) redirect("/login");
  const areas = getWorkspaceAreas(identity.permissions).filter(
    ({ id }) => !["home", "sessions", "settings"].includes(id),
  );
  const canReadMembers = actor.permissions.has("members:read");
  const canReadNews = actor.permissions.has("news:read");
  const canWriteNews = actor.permissions.has("news:write");
  const [published, drafts, members] = await Promise.allSettled([
    getNewsPayload().then(listLatestPublicNews),
    canReadNews
      ? getNewsPayload().then((payload) =>
          listNewsDrafts(payload, actor, {
            collection: "drafts",
            state: "active",
            sort: "updated-desc",
          }),
        )
      : Promise.resolve(null),
    canReadMembers
      ? listMembers(getDatabase().pool, actor, {
          registrationStatus: "unknown",
          archived: "active",
        })
      : Promise.resolve(null),
  ]);
  return (
    <div className="page-stack home-page">
      <header className="home-header">
        <div>
          <p className="eyebrow">PAINEL CAAB</p>
          <h1>Bom trabalho, {identity.name.trim().split(/\s+/)[0]}.</h1>
          <p>Acompanhe as publicações e continue o trabalho da sua equipe.</p>
        </div>
        <span className="home-date">
          <CalendarDays size={17} aria-hidden="true" />
          {date(new Date().toISOString())}
        </span>
      </header>

      <nav className="home-shortcuts" aria-label="Atalhos de trabalho">
        {areas.map(({ id, href, label, icon: Icon }) => (
          <Link key={id} href={href} className="home-shortcut module-card">
            <Icon size={21} aria-hidden="true" />
            <span>{label}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </nav>

      <section className="home-section" aria-labelledby="latest-news-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">COMUNICAÇÃO</p>
            <h2 id="latest-news-title">Últimas notícias publicadas</h2>
          </div>
          {canReadNews && (
            <Link className={buttonVariants({ size: "compact" })} href="/news">
              Ver notícias <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
        {published.status === "rejected" ? (
          <p className="home-empty" role="status">
            Não foi possível carregar as publicações. Acesse Notícias para tentar novamente.
          </p>
        ) : published.value.length ? (
          <div className="home-news-grid">
            {published.value.map((item) => (
              <Link
                key={item.id}
                className="home-news-card"
                href={`/content/${item.channel}/news/${item.id}`}
              >
                <NewsThumbnail
                  src={
                    item.cover
                      ? `/api/v1/content/${item.channel}/news/${item.id}/media/${item.cover.fileId}`
                      : undefined
                  }
                />
                <div className="home-news-copy">
                  <div className="home-news-meta">
                    <span>{item.category || "Notícia"}</span>
                    <time dateTime={item.publishedAt}>{date(item.publishedAt)}</time>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <span className="home-news-read">
                    Ler notícia <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="home-empty">
            <p>Ainda não há notícias publicadas.</p>
            {canWriteNews && <Link href="/news/new">Preparar a primeira notícia</Link>}
          </div>
        )}
      </section>

      {(canReadNews || canReadMembers) && (
        <section className="home-section" aria-labelledby="continue-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TRABALHO EM ANDAMENTO</p>
              <h2 id="continue-title">Para continuar</h2>
            </div>
          </div>
          <div className="home-work-grid">
            {canReadNews && (
              <article className="panel home-work-card">
                <div className="home-card-heading">
                  <span className="home-card-icon">
                    <FilePenLine size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>Notícias em preparação</h3>
                    <p>Rascunhos atualizados mais recentemente.</p>
                  </div>
                </div>
                {drafts.status === "rejected" ? (
                  <p className="home-empty" role="status">
                    Rascunhos indisponíveis no momento.
                  </p>
                ) : drafts.value?.items.length ? (
                  <ul className="home-work-list">
                    {drafts.value.items.slice(0, 4).map((item) => (
                      <li key={item.id}>
                        <Link href={`/news/${item.id}`}>
                          <span>
                            <strong>{item.metadata.title || "Notícia sem título"}</strong>
                            <small>Atualizada em {date(item.updatedAt)}</small>
                          </span>
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="home-empty">Nenhum rascunho em preparação.</p>
                )}
                <div className="home-card-actions">
                  <Link className={buttonVariants({ size: "compact" })} href="/news/drafts">
                    Ver rascunhos
                  </Link>
                  {canWriteNews && (
                    <Link
                      className={buttonVariants({ intent: "primary", size: "add" })}
                      href="/news/new"
                    >
                      <Plus size={16} aria-hidden="true" /> Nova notícia
                    </Link>
                  )}
                </div>
              </article>
            )}
            {canReadMembers && (
              <article className="panel home-work-card">
                <div className="home-card-heading">
                  <span className="home-card-icon">
                    <UsersRound size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>Cadastros sem análise</h3>
                    <p>Associados com análise cadastral não avaliada.</p>
                  </div>
                </div>
                {members.status === "rejected" ? (
                  <p className="home-empty" role="status">
                    Cadastros indisponíveis no momento.
                  </p>
                ) : members.value?.items.length ? (
                  <ul className="home-work-list">
                    {members.value.items.slice(0, 4).map((item) => (
                      <li key={item.id}>
                        <Link href={`/members/${item.id}`}>
                          <span>
                            <strong>{item.name}</strong>
                            <small>Análise não avaliada</small>
                          </span>
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="home-empty">Nenhum cadastro sem análise.</p>
                )}
                <div className="home-card-actions">
                  <Link
                    className={buttonVariants({ size: "compact" })}
                    href="/members?registrationStatus=unknown"
                  >
                    Ver cadastros
                  </Link>
                  {actor.permissions.has("members:write") && (
                    <Link
                      className={buttonVariants({ intent: "primary", size: "add" })}
                      href="/members/new"
                    >
                      <Plus size={16} aria-hidden="true" /> Novo associado
                    </Link>
                  )}
                </div>
              </article>
            )}
          </div>
        </section>
      )}

      <section className="home-section" aria-labelledby="upcoming-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PRÓXIMOS MÓDULOS</p>
            <h2 id="upcoming-title">Novas áreas de acompanhamento</h2>
          </div>
          <span className="planning-label">Em planejamento</span>
        </div>
        <div className="home-upcoming-grid">
          {upcoming.map(({ name, description, icon: Icon }) => (
            <article className="home-upcoming-card" key={name}>
              <Icon size={23} strokeWidth={1.6} aria-hidden="true" />
              <h3>{name}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
