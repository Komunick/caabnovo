import { describe, expect, it } from "vitest";
import { emptyNewsBody, newsBodySchema } from "../src/news-body";

const body = (child: unknown) => ({
  root: { ...emptyNewsBody.root, children: [{ type: "paragraph", version: 1, children: [child] }] },
});

describe("news rich text boundary", () => {
  it("canonicalizes image references without accepting URLs or executable attributes", () => {
    const fileId = crypto.randomUUID();
    const result = newsBodySchema.parse({
      root: {
        ...emptyNewsBody.root,
        children: [
          {
            type: "news-image",
            version: 1,
            fileId,
            alt: " Imagem ",
            caption: " Legenda ",
            src: "javascript:alert(1)",
            onerror: "alert(1)",
          },
        ],
      },
    });
    expect(result.root.children).toEqual([
      { type: "news-image", version: 1, fileId, alt: "Imagem", caption: "Legenda" },
    ]);
    expect(
      newsBodySchema.safeParse(body({ type: "news-image", version: 1, fileId, alt: "" })).success,
    ).toBe(false);
    for (const invalid of [
      { fileId: "https://outside.test/image" },
      { alt: "x".repeat(501) },
      { caption: "x".repeat(501) },
    ]) {
      expect(
        newsBodySchema.safeParse({
          root: {
            ...emptyNewsBody.root,
            children: [{ type: "news-image", version: 1, fileId, alt: "", ...invalid }],
          },
        }).success,
      ).toBe(false);
    }
  });

  it("keeps formatted text as text and discards executable attributes and styles", () => {
    const result = newsBodySchema.parse(
      body({
        type: "text",
        version: 1,
        text: "<script>alert(1)</script>",
        format: 3,
        style: "background:url(javascript:alert(1))",
        onclick: "alert(1)",
      }),
    );
    const text = result.root.children![0]!.children![0]!;
    expect(text.text).toBe("<script>alert(1)</script>");
    expect(text.format).toBe(3);
    expect(text.style).toBe("");
    expect(text).not.toHaveProperty("onclick");
  });
  it("accepts combined basic text styles but rejects unsupported formatting bits", () => {
    for (const format of [4, 8, 15])
      expect(
        newsBodySchema.safeParse(body({ type: "text", version: 1, text: "Texto", format })).success,
      ).toBe(true);
    for (const format of [16, 32, 255, -1])
      expect(
        newsBodySchema.safeParse(body({ type: "text", version: 1, text: "Texto", format })).success,
      ).toBe(false);
  });
  it.each(["html", "script", "iframe", "upload", "link"])(
    "rejects unsupported %s nodes",
    (type) => {
      expect(
        newsBodySchema.safeParse(body({ type, version: 1, url: "javascript:alert(1)" })).success,
      ).toBe(false);
    },
  );
  it("rejects excessive content and invalid document structure", () => {
    expect(
      newsBodySchema.safeParse(body({ type: "text", version: 1, text: "x".repeat(100_001) }))
        .success,
    ).toBe(false);
    expect(
      newsBodySchema.safeParse({
        root: { ...emptyNewsBody.root, children: [{ type: "listitem", version: 1, children: [] }] },
      }).success,
    ).toBe(false);
    expect(
      newsBodySchema.safeParse({
        root: {
          ...emptyNewsBody.root,
          children: Array.from({ length: 2001 }, () => ({
            type: "paragraph",
            version: 1,
            children: [],
          })),
        },
      }).success,
    ).toBe(false);
  });
});
