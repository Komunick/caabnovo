import AxeBuilder from "@axe-core/playwright";
import { expect as baseExpect, syntheticUsers, test } from "./fixtures";

// New routes may compile on their first request when running against localhost in dev mode.
const expect = baseExpect.configure({ timeout: 15000 });

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
  await page.getByLabel("Senha").fill(syntheticUsers.ordinary.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
}

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
