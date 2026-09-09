import { describe, expect, it } from "vitest";
import { emptyNewsBody } from "../src/news-body";
import {
  createNewsDraftRequestSchema,
  newsDraftMetadataSchema,
  publishNewsRequestSchema,
  updateNewsDraftRequestSchema,
  newsListQuerySchema,
  publicNewsQuerySchema,
} from "../src/news";

describe("news contracts", () => {
  it("limits administrative filters without expanding the public API", () => {
    expect(newsListQuerySchema.safeParse({ sort: "arbitrary SQL" }).success).toBe(false);
    expect(newsListQuerySchema.safeParse({ updatedWithin: "-1" }).success).toBe(false);
    expect(newsListQuerySchema.safeParse({ category: "a".repeat(81) }).success).toBe(false);
    expect(
      newsListQuerySchema.parse({ collection: "drafts", channel: "app", cover: "yes" }),
    ).toMatchObject({ collection: "drafts", channel: "app", cover: "yes", page: 1 });
    expect(publicNewsQuerySchema.safeParse({ collection: "drafts" }).success).toBe(false);
  });
  it("allows an incomplete draft without pretending it is publishable", () => {
    expect(createNewsDraftRequestSchema.parse({ metadata: {} })).toEqual({
      body: emptyNewsBody,
      metadata: {
        title: "",
        summary: "",
        slug: "",
        category: "",
        tags: [],
        channels: [],
        cover: null,
        highlight: null,
      },
    });
    expect(publishNewsRequestSchema.safeParse({ expectedVersion: 1, channels: [] }).success).toBe(
      false,
    );
  });

  it("normalizes editorial metadata without interpreting text as HTML", () => {
    const metadata = newsDraftMetadataSchema.parse({
      title: "  Plantão de atendimento  ",
      summary: "  <script>alert(1)</script>  ",
      slug: "  plantao-de-atendimento  ",
      tags: ["  Atendimento  "],
    });
    expect(metadata.title).toBe("Plantão de atendimento");
    expect(metadata.slug).toBe("plantao-de-atendimento");
    expect(metadata.tags).toEqual(["Atendimento"]);
    // Plain text must be escaped by the renderer; this contract is not an HTML sanitizer.
    expect(metadata.summary).toBe("<script>alert(1)</script>");
  });

  it.each(["status", "published", "authorId", "permissions", "approval"])(
    "rejects injected %s instead of silently accepting it",
    (field) => {
      expect(
        createNewsDraftRequestSchema.safeParse({ metadata: {}, [field]: "forged" }).success,
      ).toBe(false);
      expect(newsDraftMetadataSchema.safeParse({ [field]: "forged" }).success).toBe(false);
    },
  );

  it.each(["../admin", "Título", "two--hyphens", "trailing-", "https://site.test"])(
    "rejects an invalid slug: %s",
    (slug) => expect(newsDraftMetadataSchema.safeParse({ slug }).success).toBe(false),
  );

  it("bounds metadata and requires valid file references", () => {
    for (const metadata of [
      { title: "a".repeat(201) },
      { summary: "a".repeat(501) },
      { slug: "a".repeat(181) },
      { category: "a".repeat(81) },
      { highlight: { order: 0 } },
      { highlight: { order: 101 } },
      { highlight: { order: 1.5 } },
      { tags: [" "] },
      { tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`) },
      { tags: ["a".repeat(81)] },
      { cover: { fileId: "https://unverified.test/image.png", alt: "Capa" } },
      { cover: { fileId: crypto.randomUUID(), alt: "a".repeat(501) } },
    ]) {
      expect(newsDraftMetadataSchema.safeParse(metadata).success).toBe(false);
    }
    expect(
      newsDraftMetadataSchema.safeParse({
        title: "a".repeat(200),
        cover: { fileId: crypto.randomUUID(), alt: "" },
      }).success,
    ).toBe(true);
  });

  it("rejects unknown or duplicate destinations", () => {
    for (const channels of [["site", "site"], ["email"], ["app", "site", "app"]]) {
      expect(newsDraftMetadataSchema.safeParse({ channels }).success).toBe(false);
      expect(publishNewsRequestSchema.safeParse({ expectedVersion: 1, channels }).success).toBe(
        false,
      );
    }
    expect(
      publishNewsRequestSchema.parse({ expectedVersion: 1, channels: ["site", "app"] }),
    ).toEqual({
      expectedVersion: 1,
      channels: ["site", "app"],
    });
  });

  it("requires a positive safe integer version for mutation", () => {
    for (const expectedVersion of [undefined, 0, -1, 1.5, "1", Number.MAX_SAFE_INTEGER + 1]) {
      expect(
        updateNewsDraftRequestSchema.safeParse({ metadata: {}, expectedVersion }).success,
      ).toBe(false);
    }
    expect(
      updateNewsDraftRequestSchema.safeParse({
        metadata: {},
        body: emptyNewsBody,
        expectedVersion: 1,
      }).success,
    ).toBe(true);
  });
});
