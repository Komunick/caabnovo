import type { NewsChannel, NewsDraftMetadata } from "@caab/contracts";
import { NewsBodyView } from "./news-body";
import styles from "./news-preview.module.css";

export function NewsArticle({
  id,
  metadata,
  body,
  date,
  availableFileIds,
  channel,
  heading = "h2",
}: {
  id: string;
  metadata: Pick<NewsDraftMetadata, "title" | "summary" | "category" | "cover" | "tags">;
  body: unknown;
  date: string;
  availableFileIds: readonly string[];
  channel?: NewsChannel;
  heading?: "h1" | "h2";
}) {
  const Heading = heading;
  return (
    <article className={styles.article}>
      <header>
        <p className={styles.category}>{metadata.category || "Notícias"}</p>
        <Heading>{metadata.title || "Título da notícia"}</Heading>
        {metadata.summary && <p className={styles.summary}>{metadata.summary}</p>}
        <p className={styles.byline}>
          CAAB <span aria-hidden="true">·</span>{" "}
          <time dateTime={date}>
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "long",
              timeZone: "America/Sao_Paulo",
            }).format(new Date(date))}
          </time>
        </p>
      </header>
      {metadata.cover &&
        (availableFileIds.includes(metadata.cover.fileId) ? (
          <img
            className={styles.cover}
            src={
              channel
                ? `/api/v1/content/${channel}/news/${id}/media/${metadata.cover.fileId}`
                : `/api/v1/news/${id}/media/${metadata.cover.fileId}`
            }
            alt={metadata.cover.alt || "Capa sem descrição; complete antes de publicar"}
          />
        ) : (
          <p className={styles.unavailable}>A capa ainda não está disponível para visualização.</p>
        ))}
      <NewsBodyView body={body} newsId={id} channel={channel} availableFileIds={availableFileIds} />
      {metadata.tags.length > 0 && (
        <footer className={styles.tags} aria-label="Assuntos">
          {metadata.tags.map((tag, index) => (
            <span key={`${tag}-${index}`}>{tag}</span>
          ))}
        </footer>
      )}
    </article>
  );
}
