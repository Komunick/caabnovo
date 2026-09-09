import { describe, it, expect } from "vitest";
import { updateNewsDraftRequestSchema, emptyNewsBody } from "@caab/contracts";
import { newsFieldErrors } from "./field-errors";

describe("editor field validation feedback", () => {
  it("maps actual contract failures to the affected controls", () => {
    const result = updateNewsDraftRequestSchema.safeParse({
      expectedVersion: 1,
      metadata: { slug: "Endereço inválido", tags: ["tag", ""], highlight: { order: 101 } },
      body: emptyNewsBody,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const fields = newsFieldErrors(result.error.issues);
    expect(fields.slug).toContain("sem espaços ou acentos");
    expect(fields.tags).toContain("vírgulas");
    expect(fields.highlight).toContain("1 a 100");
    expect(fields.title).toBeUndefined();
  });
  it("maps server publication requirements and media errors", () => {
    expect(
      newsFieldErrors([
        { path: "title", code: "TITLE_REQUIRED" },
        { path: "cover.alt", code: "COVER_ALT_REQUIRED" },
        { path: "content.files", code: "FILE_UNAVAILABLE" },
      ]),
    ).toEqual({
      title: "Informe um título antes de publicar.",
      coverAlt: "Descreva a capa antes de publicar.",
      body: "Há uma imagem indisponível no conteúdo. Aguarde a liberação ou substitua a imagem.",
    });
    expect(newsFieldErrors([{ path: "metadata.slug", code: "NEWS_SLUG_CONFLICT" }]).slug).toContain(
      "Escolha outro",
    );
    expect(newsFieldErrors([{ path: "runAt" }]).runAt).toContain("365 dias");
  });
  it("does not expose unknown error fields or mark concurrency as a formatting failure", () => {
    expect(
      newsFieldErrors([
        { path: "expectedVersion", code: "NEWS_VERSION_CONFLICT" },
        { path: "internal.secret", code: "sql" },
      ]),
    ).toEqual({});
  });
});
