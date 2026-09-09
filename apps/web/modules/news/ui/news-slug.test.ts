import { describe, expect, it } from "vitest";
import { newsSlugFromTitle } from "./news-slug";
describe("automatic news address", () => {
  it("normalizes titles, caps length and keeps duplicate titles distinct", () => {
    expect(newsSlugFromTitle(" Ação & Saúde: novidades! ", "12345678-abcd")).toBe(
      "acao-saude-novidades-12345678",
    );
    const long = newsSlugFromTitle("Notícias da CAAB ".repeat(20), "abcdef12-1234");
    expect(long.length).toBeLessThanOrEqual(80);
    expect(long).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(newsSlugFromTitle("", "12345678")).toBe("");
    expect(newsSlugFromTitle("🎉", "12345678")).toBe("noticia-12345678");
    expect(newsSlugFromTitle("Notícia", "12345678")).not.toBe(
      newsSlugFromTitle("Notícia", "abcdef12"),
    );
  });
});
