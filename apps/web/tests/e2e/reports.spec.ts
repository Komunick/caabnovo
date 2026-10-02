import { expectExportAboveFilters } from "./panel-actions";
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
  // This regression also runs alone, before any other browser test creates members.
  const syntheticMemberName = `Report columns ${randomUUID()}`;
  const createdMember = await page.request.post("/api/v1/members", {
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": randomUUID(),
      "idempotency-key": randomUUID(),
    },
    data: { profile: { name: syntheticMemberName }, justification: "Synthetic report regression" },
  });
  expect(createdMember.status()).toBe(201);
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
  await expect(page.getByRole("link", { name: "Exportar dados", exact: true })).toBeVisible();
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
  await page.getByLabel("Buscar por nome ou tela").fill(syntheticMemberName);
  await page.getByRole("button", { name: "Gerar relatório", exact: true }).click();
  // Re-selecting Name appends it to query.columns, while the table keeps catalog order.
  await page.getByRole("checkbox", { name: "Nome", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Nome", exact: true }).check();
  await page.getByRole("button", { name: "Gerar relatório", exact: true }).click();
  const exportLink = page.getByRole("link", { name: "Exportar dados", exact: true });
  await expect(exportLink).toBeVisible();
  const displayedColumns = await page
    .getByRole("table", { name: "Registros do relatório" })
    .getByRole("columnheader")
    .allTextContents();
  expect(displayedColumns[0]).toBe("Nome");
  const exportUrl = new URL((await exportLink.getAttribute("href"))!, page.url());
  expect(exportUrl.searchParams.get("columns")?.split(",")[0]).toBe("name");
  // CAAB-24: the detailed analysis without grouping downloads directly, with the applied selection.
  await page.getByRole("link", { name: "Exportar dados", exact: true }).click();
  await expect(page).toHaveURL(/\/reports\/exportar\?dataset=members/);
  await expect(
    page.getByRole("heading", { name: "Exportar associados", exact: true }),
  ).toBeVisible();
  for (const [label, extension, signature] of [
    ["CSV", "csv", ""],
    ["Excel", "xlsx", "PK"],
    ["PDF", "pdf", "%PDF-"],
  ]) {
    const downloading = page.waitForEvent("download", { timeout: 60000 });
    await page.getByRole("button", { name: `Exportar em ${label}`, exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(new RegExp(`^reports-.+\\.${extension}$`));
    const path = testInfo.outputPath(`reports-detail.${extension}`);
    await download.saveAs(path);
    const bytes = await readFile(path);
    if (signature) expect(bytes.subarray(0, signature.length).toString()).toBe(signature);
    else
      expect(
        bytes
          .toString()
          .replace(/^\uFEFF/, "")
          .split(/\r?\n/)[0],
      ).toBe(displayedColumns.map((label) => `"${label}"`).join(","));
  }
  await page.getByRole("link", { name: "Voltar aos relatórios", exact: true }).click();
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
  const filtersPanel = page.getByRole("region", { name: "Período e filtros", exact: true });
  const exportAction = filtersPanel.getByRole("link", { name: "Exportar dados", exact: true });
  await expectExportAboveFilters(filtersPanel, exportAction, filtersPanel.locator("form"));
  await page.screenshot({ path: testInfo.outputPath("reports-desktop-light.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await expectWcag22AA(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expectExportAboveFilters(filtersPanel, exportAction, filtersPanel.locator("form"));
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

test("grouped, summary and evolution download directly with preserved selection and recoverable failure", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  for (const dataset of ["membersGrouped", "summary", "executive"]) {
    await page.goto(
      `/reports/exportar?dataset=${dataset}&groupBy=city&from=2020-01-01&to=2026-10-02&environment=test&notes=Análise%20sintética`,
    );
    const from = page.getByLabel(
      dataset === "membersGrouped" ? "Data do cadastro: a partir de" : "Data inicial da comparação",
      { exact: true },
    );
    await expect(from).toHaveValue("2020-01-01");
    if (dataset === "membersGrouped")
      await expect(page.getByLabel("Agrupar por", { exact: true })).toHaveValue("city");
    else {
      await expect(page.getByLabel("Ambiente", { exact: true })).toHaveValue("test");
      await expect(page.getByLabel("Análise da gestão (opcional)")).toHaveValue(
        "Análise sintética",
      );
    }
    await expectWcag22AA(page);
    for (const [label, extension, signature] of [
      ["CSV", "csv", ""],
      ["Excel", "xlsx", "PK"],
      ["PDF", "pdf", "%PDF-"],
    ]) {
      const button = page.getByRole("button", { name: `Exportar em ${label}`, exact: true });
      await expect(button).toBeEnabled();
      const downloading = page.waitForEvent("download");
      await button.click();
      const download = await downloading;
      const path = testInfo.outputPath(`${dataset}.${extension}`);
      await download.saveAs(path);
      const bytes = await readFile(path);
      expect(bytes.length).toBeGreaterThan(0);
      if (signature) expect(bytes.subarray(0, signature.length).toString()).toBe(signature);
      await expect(page.locator(".export-form").getByRole("status")).toContainText(
        "Geração e transferência concluídas pelo servidor",
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "dark";
    });
    await expectWcag22AA(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`${dataset}-mobile-dark.png`),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "light";
    });
    await page.screenshot({
      path: testInfo.outputPath(`${dataset}-desktop-light.png`),
      fullPage: true,
    });
    // Invalid period is rejected before download, without discarding the user's selection.
    await from.fill("2027-01-01");
    await page.getByRole("button", { name: "Exportar em CSV", exact: true }).click();
    await expect(from).toHaveValue("2027-01-01");
    await expect(page.locator(".export-form").getByRole("alert")).toBeVisible();
    await from.fill("2020-01-01");
    const retry = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar em CSV", exact: true }).click();
    await (await retry).saveAs(testInfo.outputPath(`${dataset}-retry.csv`));
  }
});

test("access export explicitly selects production and preserves other environments", async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/reports/exportar?dataset=access&environment=");
  const environment = page.getByRole("combobox", {
    name: "Ambiente (padrão: produção)",
    exact: true,
  });
  await expect(environment).toHaveValue("production");
  await expect(environment.locator("option")).toHaveText(["Produção", "Desenvolvimento", "Teste"]);
  await expect(
    page.getByRole("combobox", { name: "Canal", exact: true }).locator('option[value=""]'),
  ).toHaveText("Todos");
  await expectWcag22AA(page);
  await page.screenshot({
    path: testInfo.outputPath("reports-access-environment.png"),
    fullPage: true,
  });
  for (const value of ["production", "development", "test"]) {
    if (value !== "production") await environment.selectOption(value);
    const requested = page.waitForRequest(
      (request) =>
        request.url().endsWith("/api/v1/exports/download") && request.method() === "POST",
    );
    const downloading = page.waitForEvent("download");
    const button = page.getByRole("button", { name: "Exportar em CSV", exact: true });
    await expect(button).toBeEnabled();
    await button.click();
    const form = new URLSearchParams((await requested).postData()!);
    expect(JSON.parse(form.get("config")!).filters.environment).toBe(value);
    const download = await downloading;
    await download.saveAs(testInfo.outputPath(`access-${value}.csv`));
    await expect(page.locator(".export-form").getByRole("status")).toContainText(
      "Geração e transferência concluídas pelo servidor",
    );
  }
});
