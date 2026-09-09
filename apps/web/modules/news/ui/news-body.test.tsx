import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NewsBodyView } from "./news-body";

describe("news preview renderer", () => {
  it("renders only released references with escaped descriptions and captions", () => {
    const newsId = crypto.randomUUID();
    const fileId = crypto.randomUUID();
    const body = {
      root: {
        type: "root",
        version: 1,
        children: [
          {
            type: "news-image",
            version: 1,
            fileId,
            alt: '" onerror="alert(1)',
            caption: "<script>alert(1)</script>",
            src: "https://outside.test",
          },
        ],
      },
    };
    const hidden = renderToStaticMarkup(<NewsBodyView body={body} newsId={newsId} />);
    expect(hidden).not.toContain("<img");
    expect(hidden).not.toContain(fileId);
    const visible = renderToStaticMarkup(
      <NewsBodyView body={body} newsId={newsId} availableFileIds={[fileId]} />,
    );
    expect(visible).toContain(`/api/v1/news/${newsId}/media/${fileId}`);
    expect(visible).toContain("&lt;script&gt;");
    expect(visible).not.toContain(' onerror="');
    expect(visible).not.toContain("outside.test");
  });

  it("escapes editorial text and renders only allowed formatting", () => {
    const html = renderToStaticMarkup(
      <NewsBodyView
        body={{
          root: {
            type: "root",
            version: 1,
            children: [
              {
                type: "paragraph",
                version: 1,
                children: [
                  {
                    type: "text",
                    version: 1,
                    text: '<img src=x onerror="alert(1)">',
                    format: 15,
                    style: "background:url(javascript:alert(1))",
                  },
                ],
              },
            ],
          },
        }}
      />,
    );
    expect(html).toContain("&lt;img");
    expect(html).toContain("<strong><em>");
    expect(html).toContain("<s><u>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("javascript:");
  });
  it("rejects active nodes before rendering", () => {
    expect(() =>
      renderToStaticMarkup(
        <NewsBodyView
          body={{
            root: {
              type: "root",
              version: 1,
              children: [{ type: "iframe", version: 1, src: "https://untrusted.test" }],
            },
          }}
        />,
      ),
    ).toThrow();
  });
});
