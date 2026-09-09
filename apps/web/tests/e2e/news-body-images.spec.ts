import AxeBuilder from "@axe-core/playwright";
import { expect as baseExpect, syntheticUsers, test } from "./fixtures";

const expect = baseExpect.configure({ timeout: 15000 });

test("body images can be uploaded, described, moved and restored without losing text", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.accessManager.email);
  await page.getByLabel("Senha").fill(syntheticUsers.accessManager.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/news/new");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/);
  const newsId = page.url().split("/").at(-1)!;
  await page
    .getByRole("textbox", { name: "Conteúdo da notícia", exact: true })
    .fill("Texto preservado entre imagens.");
  await page.getByRole("button", { name: "Inserir imagem no corpo", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Enviar imagem", { exact: true }).setInputFiles({
    name: "corpo-sintetico.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    dialog.getByRole("status").filter({ hasText: "Imagem enviada para verificação" }),
  ).toBeVisible();
  await dialog.getByLabel("Descrição da imagem", { exact: true }).fill("Imagem sintética no corpo");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await dialog.getByRole("button", { name: "Adicionar ao conteúdo" }).click();
  await expect(dialog).toBeHidden();
  const block = page.getByRole("region", { name: "Imagem no corpo", exact: true });
  await expect(block).toBeVisible();
  await block.getByText("Descrição e legenda", { exact: true }).click();
  await block.getByLabel("Legenda da imagem").fill("Legenda <script>inofensiva</script>");
  await block.getByRole("button", { name: "Mover imagem para cima" }).click();
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Rascunho salvo. Revisão 2" }),
  ).toBeVisible();
  await page.reload();
  await block.getByText("Descrição e legenda", { exact: true }).click();
  await expect(block.getByLabel("Descrição da imagem no corpo")).toHaveValue(
    "Imagem sintética no corpo",
  );
  await expect(block.getByLabel("Legenda da imagem")).toHaveValue(
    "Legenda <script>inofensiva</script>",
  );
  const saved = await (await page.request.get(`/api/v1/news/${newsId}`)).json();
  expect(saved.body.root.children[0].type).toBe("news-image");
  await expect(
    page.getByRole("textbox", { name: "Conteúdo da notícia", exact: true }),
  ).toContainText("Texto preservado entre imagens.");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: testInfo.outputPath("news-body-image-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Prévia privada" }).click();
  await expect(page.locator("figcaption")).toHaveText("Legenda <script>inofensiva</script>");
  await expect(page.locator(".news-prose script")).toHaveCount(0);
  await page.getByRole("link", { name: "Voltar ao editor" }).click();
  await block.getByRole("button", { name: "Remover imagem do corpo" }).click();
  await expect(block).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(block).toBeVisible();
  await block.getByRole("button", { name: "Remover imagem do corpo" }).click();
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Rascunho salvo. Revisão 3" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Recuperar revisão 2", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await block.getByText("Descrição e legenda", { exact: true }).click();
  await expect(block.getByLabel("Descrição da imagem no corpo")).toHaveValue(
    "Imagem sintética no corpo",
  );
  await expect(
    page.getByRole("textbox", { name: "Conteúdo da notícia", exact: true }),
  ).toContainText("Texto preservado entre imagens.");
});
