import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test, expect, syntheticUsers } from "./fixtures";
import { expectWcag22AA, expectThemeContrast } from "./accessibility";
test.use({
  actionTimeout: 15000,
  userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
});
test("reports: three views, private saved queries, preserved edits, usage and real exports", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page
      .getByRole("navigation", { name: "Navegação administrativa" })
      .getByRole("link", { name: "Relatórios", exact: true }),
  ).toBeVisible();
  await page
    .locator(".sidebar-navigation")
    .getByRole("link", { name: "Relatórios", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Resumo gerencial", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Indicadores do período" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar CSV", exact: true })).toBeEnabled();
  let name = `Consulta relatório ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Nome da consulta").fill(name);
  await page.getByRole("button", { name: "Salvar consulta", exact: true }).click();
  await expect(
    page.getByText("Consulta salva. Ao abrir novamente, os dados serão atualizados."),
  ).toBeVisible();
  const saved = (await (await page.request.get("/api/v1/reports/queries")).json()).find(
    (item: { name: string }) => item.name === name,
  );
  const remoteName = `${name} atual`;
  expect(
    (
      await page.request.put(`/api/v1/reports/queries/${saved.id}`, {
        headers: { origin: new URL(page.url()).origin, "x-csrf-token": randomUUID() },
        data: {
          name: remoteName,
          query: saved.configuration.query,
          notes: "",
          version: saved.version,
        },
      })
    ).ok(),
  ).toBe(true);
  await page.getByLabel("Nome da consulta").fill("Edição local preservada");
  await page.getByRole("button", { name: "Atualizar consulta", exact: true }).click();
  await expect(page.getByText(/Esta consulta mudou/)).toBeVisible();
  await expect(page.getByLabel("Nome da consulta")).toHaveValue("Edição local preservada");
  await expect(page.getByRole("button", { name: remoteName, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar edição", exact: true }).click();
  await page.getByRole("button", { name: remoteName, exact: true }).click();
  await expect(page.getByLabel("Nome da consulta")).toHaveValue(remoteName);
  name = remoteName;
  await page.getByRole("button", { name: "Análise detalhada", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Análise detalhada", exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Relatório", exact: true }).selectOption("members");
  await page.getByLabel("Buscar por nome ou tela").fill("Pessoa inexistente relatório sintético");
  await page.getByRole("button", { name: "Gerar relatório", exact: true }).click();
  await expect(
    page.getByText("Nenhum registro encontrado. Ajuste os filtros ou escolha outro período."),
  ).toBeVisible();
  await page.getByLabel("Buscar por nome ou tela").fill("");
  await page.getByRole("button", { name: "Gerar relatório", exact: true }).click();
  await expect(page.getByRole("button", { name: "Exportar Excel", exact: true })).toBeEnabled();
  for (const [label, extension, signature] of [
    ["CSV", "csv", ""],
    ["Excel", "xlsx", "PK"],
    ["PDF", "pdf", "%PDF-"],
  ]) {
    const requested = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/v1/reports/exports") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: `Exportar ${label}`, exact: true }).click();
    const requestedResponse = await requested;
    expect(requestedResponse.status()).toBe(202);
    const { id } = await requestedResponse.json();
    const downloadLink = page.locator(`a[href="/api/v1/reports/exports/${id}/download"]`);
    await expect(downloadLink).toBeVisible({ timeout: 60000 });
    const downloading = page.waitForEvent("download", { timeout: 15000 });
    await downloadLink.click();
    const download = await downloading;
    const path = testInfo.outputPath(`reports-detail.${extension}`);
    await download.saveAs(path);
    const bytes = await readFile(path);
    if (signature) expect(bytes.subarray(0, signature.length).toString()).toBe(signature);
    else expect(bytes.toString()).toContain("America/Bahia");
  }
  await page.getByRole("button", { name: "Resultados e evolução", exact: true }).click();
  await page
    .getByLabel("Comentários para a apresentação")
    .fill("Evolução sintética para revisão institucional.");
  await page
    .locator(".sidebar-navigation")
    .getByRole("link", { name: "Notícias", exact: true })
    .click();
  await page
    .locator(".sidebar-navigation")
    .getByRole("link", { name: "Relatórios", exact: true })
    .click();
  await expect(page.getByLabel("Comentários para a apresentação")).toHaveValue(
    "Evolução sintética para revisão institucional.",
  );
  await expect(page.getByText(/Coleta observada desde/)).toBeVisible();
  await page.getByRole("button", { name: "Modo apresentação", exact: true }).click();
  await expect(
    page.getByText("Evolução sintética para revisão institucional.", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Comentários para a apresentação")).toBeVisible();
  await expectWcag22AA(page);
  await expectThemeContrast(page, ".module-tabs .button");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: testInfo.outputPath("reports-desktop-light.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await expectWcag22AA(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: testInfo.outputPath("reports-mobile-dark.png"), fullPage: true });
  await page.getByRole("button", { name: `Excluir ${name}`, exact: true }).click();
  await expect(page.getByText("Consulta excluída.")).toBeVisible();
});
test("reports denies ordinary access and export before data", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.ordinary.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/reports");
  await expect(page.getByText("Você não tem permissão para acessar relatórios.")).toBeVisible();
  expect((await page.request.get("/api/v1/reports/exports")).status()).toBe(403);
});
