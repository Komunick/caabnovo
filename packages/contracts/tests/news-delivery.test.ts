import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { newsDeliveryDocumentSchema } from "../src/news-delivery";

async function example() {
  return JSON.parse(
    await readFile(
      resolve(process.cwd(), "specs/004-news-publishing/contracts/delivery-example.json"),
      "utf8",
    ),
  );
}

describe("news consumer contract v1", () => {
  it("accepts the documented app example and preserves image references", async () => {
    const result = newsDeliveryDocumentSchema.parse(await example());
    expect(result.channel).toBe("app");
    expect(result.body.root.children?.[1]).toMatchObject({
      type: "news-image",
      alt: "Imagem sintética de demonstração",
    });
  });
  it("rejects administrative fields and incompatible versions", async () => {
    const input = await example();
    for (const invalid of [
      { schemaVersion: 2 },
      { channel: "push" },
      { editorUserId: crypto.randomUUID() },
      { session: "internal" },
      { history: [] },
    ])
      expect(newsDeliveryDocumentSchema.safeParse({ ...input, ...invalid }).success).toBe(false);
  });
  it("rejects missing descriptions in published body images", async () => {
    const input = await example();
    input.body.root.children[1].alt = " ";
    expect(newsDeliveryDocumentSchema.safeParse(input).success).toBe(false);
  });
});
