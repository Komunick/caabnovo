import { describe, expect, it } from "vitest";
import { emptyNewsBody } from "@caab/contracts";
import { newsDeliveryDocument } from "./delivery-document";

const published = {
  id: crypto.randomUUID(),
  revision: 2,
  _status: "published",
  archived: false,
  updatedAt: "2026-09-09T12:00:00.000Z",
  editorUserId: crypto.randomUUID(),
  metadata: { title: "Notícia mobile", slug: "noticia-mobile", channels: ["app"] },
  body: emptyNewsBody,
  internalNotes: "Dado que não pertence ao consumidor",
};
describe("news delivery document", () => {
  it("includes only the selected channel and editorial content", () => {
    const document = newsDeliveryDocument(published, "app");
    expect(document).toMatchObject({
      schemaVersion: 1,
      id: published.id,
      revision: 2,
      channel: "app",
      title: "Notícia mobile",
      publishedAt: published.updatedAt,
    });
    expect(Object.keys(document).sort()).toEqual(
      [
        "schemaVersion",
        "id",
        "revision",
        "channel",
        "publishedAt",
        "title",
        "summary",
        "slug",
        "category",
        "tags",
        "cover",
        "body",
        "highlight",
      ].sort(),
    );
  });
  it("does not expose drafts, archives or a channel that was not selected", () => {
    for (const source of [
      { ...published, _status: "draft" },
      { ...published, archived: true },
      { ...published, metadata: { ...published.metadata, channels: ["site"] } },
    ])
      expect(() => newsDeliveryDocument(source, "app")).toThrowError(
        expect.objectContaining({ status: 404 }),
      );
    expect(() => newsDeliveryDocument(published, "email")).toThrow();
  });
});
