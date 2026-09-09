import AxeBuilder from "@axe-core/playwright";
import { expect, syntheticUsers, test } from "./fixtures";

test("editor uploads a cover through the existing file flow and preserves its description", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.accessManager.email);
  await page.getByLabel("Senha").fill(syntheticUsers.accessManager.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
  await page.goto("/news/new");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/, { timeout: 15000 });
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .getByLabel("Enviar imagem", { exact: true })
    .setInputFiles({ name: "capa-sintetica.png", mimeType: "image/png", buffer: image });
  await expect(
    page.getByRole("status").filter({ hasText: "Imagem enviada para verificação" }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByLabel("Descrição da capa", { exact: true }).fill("Imagem sintética de teste");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Rascunho salvo" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Descrição da capa", { exact: true })).toHaveValue(
    "Imagem sintética de teste",
  );
  await expect(page.getByLabel("Imagens desta notícia")).not.toHaveValue("");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Remover capa do rascunho" }).click();
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Rascunho salvo" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Imagens desta notícia")).toHaveValue("");
  await expect(
    page
      .getByLabel("Imagens desta notícia")
      .getByRole("option")
      .filter({ hasText: "capa-sintetica.png" }),
  ).toHaveCount(1);
});
