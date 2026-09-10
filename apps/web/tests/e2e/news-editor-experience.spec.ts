import AxeBuilder from "@axe-core/playwright";
import { expect as baseExpect, syntheticUsers, test } from "./fixtures";
const expect = baseExpect.configure({ timeout: 15000 });

test("familiar text tools preserve formatting and preview both devices with an automatic address", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.ordinary.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/news/new");
  const title = `Saúde & ação ${crypto.randomUUID()}`;
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page
    .getByLabel("Resumo", { exact: true })
    .fill("Resumo para conferir a leitura no site e no celular.");
  await expect(page.getByLabel("Endereço legível", { exact: true })).toBeHidden();
  const body = page.getByRole("textbox", { name: "Conteúdo da notícia", exact: true });
  await body.fill("Texto com formatação preservada.");
  await body.press("ControlOrMeta+a");
  for (const name of ["Negrito", "Itálico", "Sublinhado", "Tachado"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  await page.getByRole("button", { name: "Centralizar", exact: true }).click();
  await page.getByRole("combobox", { name: "Estilo do texto" }).selectOption("h2");
  await expect(body.locator("h2")).toContainText("Texto com formatação preservada.");
  await page.getByRole("button", { name: "Salvar e visualizar", exact: true }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}\/preview$/);
  const id = page.url().split("/").at(-2)!;
  const saved = await (await page.request.get(`/api/v1/news/${id}`)).json();
  expect(saved.metadata.slug.length).toBeLessThanOrEqual(80);
  expect(saved.metadata.slug).toMatch(/^saude-acao-/);
  expect(saved.body.root.children[0]).toMatchObject({
    type: "heading",
    tag: "h2",
    format: "center",
  });
  expect(saved.body.root.children[0].children[0].format).toBe(15);
  const preview = page.getByRole("region", { name: "Prévia por dispositivo" });
  await expect(preview.locator("u")).toHaveText("Texto com formatação preservada.");
  await expect(preview.locator("s")).toHaveText("Texto com formatação preservada.");
  await page.getByRole("button", { name: "Lado a lado", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Visualização do site", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Visualização mobile", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("news-preview-both.png"), fullPage: true });
  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("news-preview-mobile.png"), fullPage: true });
  await page.getByRole("link", { name: "Voltar ao editor", exact: true }).click();
  await page.getByLabel("Título", { exact: true }).fill("Título revisado sem mudar o link");
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Rascunho salvo" })).toBeVisible();
  expect((await (await page.request.get(`/api/v1/news/${id}`)).json()).metadata.slug).toBe(
    saved.metadata.slug,
  );
  await page.getByText("Quer personalizar o endereço?", { exact: true }).click();
  await page.getByLabel("Endereço legível", { exact: true }).fill(`personalizado-${id}`);
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Rascunho salvo" })).toBeVisible();
  expect((await (await page.request.get(`/api/v1/news/${id}`)).json()).metadata.slug).toBe(
    `personalizado-${id}`,
  );
  await page.screenshot({ path: testInfo.outputPath("news-editor-mobile.png"), fullPage: true });
});
