import { Fragment, type ReactNode, type CSSProperties } from "react";
import {
  idSchema,
  newsBodySchema,
  newsChannelSchema,
  type NewsBodyNode,
  type NewsChannel,
} from "@caab/contracts";

function renderNode(
  node: NewsBodyNode,
  newsId: string | undefined,
  available: ReadonlySet<string>,
  channel?: NewsChannel,
): ReactNode {
  if (node.type === "news-image")
    return (
      <figure>
        {newsId && node.fileId && available.has(node.fileId) ? (
          <img
            className="news-cover-image"
            src={
              channel
                ? `/api/v1/content/${channel}/news/${newsId}/media/${node.fileId}`
                : `/api/v1/news/${newsId}/media/${node.fileId}`
            }
            alt={node.alt || "Imagem sem descrição; complete antes de publicar"}
          />
        ) : (
          <p>Imagem indisponível para visualização.</p>
        )}
        {node.caption ? <figcaption>{node.caption}</figcaption> : null}
      </figure>
    );
  if (node.type === "text") {
    let text: ReactNode = node.text;
    if (Number(node.format) & 2) text = <em>{text}</em>;
    if (Number(node.format) & 1) text = <strong>{text}</strong>;
    return text;
  }
  if (node.type === "linebreak") return <br />;
  const children = node.children?.map((child, index) => (
    <Fragment key={index}>{renderNode(child, newsId, available, channel)}</Fragment>
  ));
  const style = { textAlign: node.format || undefined } as CSSProperties;
  const props = { dir: node.direction ?? undefined, style };
  switch (node.type) {
    case "root":
      return children;
    case "paragraph":
      return <p {...props}>{children?.length ? children : <br />}</p>;
    case "heading":
      return node.tag === "h2" ? <h2 {...props}>{children}</h2> : <h3 {...props}>{children}</h3>;
    case "list":
      return node.listType === "number" ? (
        <ol {...props} start={node.start}>
          {children}
        </ol>
      ) : (
        <ul {...props}>{children}</ul>
      );
    case "listitem":
      return (
        <li {...props} value={node.value}>
          {children}
        </li>
      );
  }
}

export function NewsBodyView({
  body,
  newsId,
  availableFileIds = [],
  channel,
}: Readonly<{
  body: unknown;
  newsId?: string;
  availableFileIds?: readonly string[];
  channel?: NewsChannel;
}>) {
  return (
    <div className="news-prose">
      {renderNode(
        newsBodySchema.parse(body).root,
        newsId ? idSchema.parse(newsId) : undefined,
        new Set(availableFileIds),
        channel ? newsChannelSchema.parse(channel) : undefined,
      )}
    </div>
  );
}
