import AxeBuilder from "@axe-core/playwright";
import { expect as baseExpect, syntheticUsers, test } from "./fixtures";

// New routes may compile on their first request when running against localhost in dev mode.
const expect = baseExpect.configure({ timeout: 15000 });

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.ordinary.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
}

test("news list previews summaries and filters automatically with clear actions", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await signIn(page);
  await page.goto("/news/new");
  const title = `Lista sintética ${crypto.randomUUID()}`;
  const summary =
    "Resumo da notícia para verificar a apresentação em duas linhas e facilitar a leitura na listagem. ".repeat(
      4,
    );
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Resumo", { exact: true }).fill(summary);
  await page.getByLabel("Categoria", { exact: true }).fill("Atendimento");
  await page
    .getByRole("group", { name: "Destinos previstos" })
    .getByLabel("Aplicativo", { exact: true })
    .check();
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/);
  const editorUrl = page.url();
  await expect(page.getByRole("link", { name: "Prévia privada" })).toHaveClass(/button--secondary/);
  await page.getByRole("link", { name: "Notícias", exact: true }).last().click();
  await expect(page.getByRole("link", { name: title, exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Rascunhos", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Rascunhos de notícias", exact: true }),
  ).toBeVisible();
  const search = page.getByRole("searchbox", { name: "Buscar notícias pelo título" });
  await search.fill(title);
  const item = page.getByRole("list", { name: "Lista de notícias" }).getByRole("listitem");
  await expect(item).toHaveCount(1);
  await expect(item).toContainText(title);
  await expect(search).toBeFocused();
  await expect(page).toHaveURL(
    new RegExp(`search=${encodeURIComponent(title).replaceAll("%20", "\\+")}`),
  );
  await expect(page.getByRole("button", { name: "Filtrar", exact: true })).toHaveCount(0);
  await expect(item).toContainText("Sem capa");
  await expect(item).not.toContainText(/revisão/i);
  const excerpt = item.locator("p").filter({ hasText: "Resumo da notícia" });
  await expect(excerpt).toHaveCSS("-webkit-line-clamp", "2");
  const firstRow = await item.boundingBox();
  expect(firstRow!.y).toBeLessThan(450);
  await page.screenshot({ path: testInfo.outputPath("news-list-desktop.png"), fullPage: true });
  await page.getByText("Mais filtros e ordenação", { exact: true }).click();
  await page.getByLabel("Categoria", { exact: true }).fill("Atend");
  await page.getByRole("combobox", { name: "Destino previsto", exact: true }).selectOption("app");
  await page.getByRole("combobox", { name: "Destaque", exact: true }).selectOption("no");
  await page.getByRole("combobox", { name: "Imagem de capa", exact: true }).selectOption("no");
  await page.getByRole("combobox", { name: "Atualização", exact: true }).selectOption("7");
  await page.getByRole("combobox", { name: "Ordenar por", exact: true }).selectOption("title-asc");
  await expect(
    page.getByRole("status").filter({ hasText: "1 notícia nesta página" }),
  ).toBeVisible();
  await expect(item).toContainText(title);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("news-list-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .include(".news-module")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("news-list-dark.png"), fullPage: true });
  await page.getByRole("button", { name: "Ativar tema claro" }).click();
  await page.getByRole("button", { name: "Arquivadas", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Nenhuma notícia encontrada" })).toBeVisible();
  await page.getByRole("button", { name: "Todas", exact: true }).click();
  await expect(item).toHaveCount(1);
  await page.reload();
  await expect(search).toHaveValue(title);
  await expect(page.getByRole("button", { name: "Todas", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // A failed filter retains the last results and offers a working retry.
  await page.route("**/api/v1/news?*", (route) => route.fulfill({ status: 503, body: "{}" }));
  await search.fill("indisponível");
  await expect(
    page.getByRole("alert").filter({ hasText: "Não foi possível atualizar" }),
  ).toBeVisible();
  await expect(item).toContainText(title);
  await page.unroute("**/api/v1/news?*");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("heading", { name: "Nenhuma notícia encontrada" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros", exact: true }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("button", { name: "Não arquivadas", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto(editorUrl);
  await page.getByRole("button", { name: "Arquivar", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Notícia arquivada" })).toBeVisible();
  await page.goto("/news/drafts");
  await search.fill(title);
  await page.getByRole("button", { name: "Arquivadas", exact: true }).click();
  await expect(item).toHaveCount(1);
  await expect(item).toContainText(title);
  await expect(item).toContainText("Arquivada");
});

test("invalid news fields have red borders, specific hints and keyboard focus", async ({
  page,
}, testInfo) => {
  await signIn(page);
  await page.goto("/news/new");
  const slug = page.getByLabel("Endereço legível", { exact: true });
  await page.getByText("Quer personalizar o endereço?", { exact: true }).click();
  const tags = page.getByLabel("Tags", { exact: true });
  await slug.fill("Endereço com espaços");
  await tags.fill("uma,,outra");
  await page.getByLabel("Destacar notícia").check();
  const order = page.getByLabel("Ordem do destaque", { exact: true });
  await order.fill("101");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(slug).toBeFocused();
  for (const field of [slug, tags, order])
    await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#news-slug-error")).toContainText("sem espaços ou acentos");
  await expect(page.locator("#news-tags-error")).toContainText("vírgulas");
  await expect(page.locator("#news-highlight-order-error")).toContainText("1 a 100");
  const red = await slug.evaluate((el) =>
    getComputedStyle(el).getPropertyValue("--color-danger").trim(),
  );
  // Resolve the theme token through a detached element rather than hard-code one theme's RGB.
  const expectedBorder = await page.evaluate((color) => {
    const el = document.createElement("span");
    el.style.color = color;
    document.body.append(el);
    const resolved = getComputedStyle(el).color;
    el.remove();
    return resolved;
  }, red);
  await expect(slug).toHaveCSS("border-color", expectedBorder);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("news-field-errors-mobile.png"),
    fullPage: true,
  });
  await slug.fill("endereco-corrigido");
  await tags.fill("uma,outra");
  await order.fill("10");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/);
  await expect(slug).not.toHaveAttribute("aria-invalid", "true");
  const publication = page.getByRole("region", { name: "Publicação e agenda" });
  await publication.getByLabel("Aplicativo", { exact: true }).check();
  await publication.getByRole("button", { name: "Publicar agora", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByLabel("Título", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#news-title-error")).toContainText("Informe um título");
  await expect(
    page.getByRole("textbox", { name: "Conteúdo da notícia", exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#news-body-error")).toContainText("Escreva o conteúdo");
  await expect(page.getByLabel("Título", { exact: true })).toBeFocused();
});

test("panel user creates, previews, restores, duplicates and archives news", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await signIn(page);
  await page
    .getByRole("navigation", { name: "Navegação administrativa" })
    .getByRole("link", { name: "Notícias", exact: true })
    .click();
  await page.getByRole("link", { name: "Nova notícia" }).click();
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/, { timeout: 15000 });
  const url = page.url();
  const title = `Notícia sintética ${crypto.randomUUID()}`;
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page
    .getByRole("textbox", { name: "Conteúdo da notícia", exact: true })
    .fill('Conteúdo acessível <script>alert("teste")</script>');
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Rascunho salvo. Revisão 2." }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(title);
  await expect(
    page.getByRole("textbox", { name: "Conteúdo da notícia", exact: true }),
  ).toContainText("Conteúdo acessível");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("news-editor-desktop.png"), fullPage: true });
  await page.getByRole("link", { name: "Prévia privada" }).click();
  await expect(page.getByRole("heading", { name: "Prévia privada" })).toBeVisible();
  await expect(page.locator(".news-prose")).toContainText('<script>alert("teste")</script>');
  expect(await page.locator(".news-prose script").count()).toBe(0);
  await page.getByRole("link", { name: "Voltar ao editor" }).click();
  await page.getByRole("button", { name: "Recuperar revisão 1", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15000 });
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("");
  await expect(page.getByRole("status").filter({ hasText: "Versão recuperada" })).toBeVisible();
  await page.getByRole("button", { name: "Duplicar", exact: true }).click();
  await expect(page).not.toHaveURL(url);
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/, { timeout: 15000 });
  await page.getByRole("button", { name: "Arquivar", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: "Notícia arquivada" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar rascunho" })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("news-editor-mobile.png"), fullPage: true });
});

test("a stale editor retains its content when another save wins", async ({ page, context }) => {
  test.setTimeout(60_000);
  await signIn(page);
  await page.goto("/news/new");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/, { timeout: 15000 });
  const other = await context.newPage();
  await other.goto(page.url());
  await page.getByLabel("Título", { exact: true }).fill("Edição vencedora");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Revisão 2" })).toBeVisible();
  await other.getByLabel("Título", { exact: true }).fill("Meu texto preservado");
  await other.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(
    other.getByRole("alert").filter({ hasText: "Outra alteração foi salva" }),
  ).toBeVisible();
  await expect(other.getByLabel("Título", { exact: true })).toHaveValue("Meu texto preservado");
  await other.close();
});

test("anonymous requests cannot read news, versions or private previews", async ({
  page,
  request,
}) => {
  const id = crypto.randomUUID();
  for (const path of ["/api/v1/news", `/api/v1/news/${id}`, `/api/v1/news/${id}/versions`]) {
    const response = await request.get(path);
    expect(response.status()).toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
  await page.goto(`/news/${id}/preview`);
  await expect(page).toHaveURL(/\/login/);
});
