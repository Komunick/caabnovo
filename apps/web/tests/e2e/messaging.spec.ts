import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { test, expect, syntheticUsers } from "./fixtures";
import { expectWcag22AA, expectThemeContrast } from "./accessibility";
async function login(page: Page, admin = true) {
  const user = admin ? syntheticUsers.administrator : syntheticUsers.ordinary;
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}
async function choose(page: Page, label: string, name: string) {
  const input = page.getByRole("combobox", { name: label, exact: true });
  await input.fill(name);
  await expect(
    page
      .getByRole("listbox", { name: `Opções de ${label.toLocaleLowerCase("pt-BR")}` })
      .getByRole("option")
      .filter({ hasText: name })
      .first(),
  ).toBeVisible();
  await input.press("ArrowDown");
  await input.press("Enter");
}
async function capture(page: Page, options: { path: string; fullPage: boolean }) {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await expect(page.locator(".admin-topbar")).toContainText("Mensagens");
  await page.screenshot(options);
}
async function save(page: Page) {
  await page.getByRole("button", { name: /^Salvar (rascunho|modelo|público)$/ }).click();
  await expect(page).not.toHaveURL(/\/new$/);
  await expect(page.getByText("Alterações ainda não salvas", { exact: true })).toHaveCount(0);
}
test("prepare models, audiences and campaigns; preserve edits; block, schedule and cancel without a channel", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const suffix = randomUUID().slice(0, 8),
    member = `Pessoa mensagens ${suffix}`,
    model = `Modelo ${suffix}`,
    audience = `Público ${suffix}`,
    campaign = `Campanha ${suffix}`;
  await page.goto("/members/new");
  await page.getByLabel("Nome completo").fill(member);
  await page.getByRole("button", { name: "Criar cadastro", exact: true }).click();
  await expect(page.getByRole("heading", { name: member, exact: true })).toBeVisible();
  await page.goto("/messages/templates");
  await page.getByRole("link", { name: "Novo modelo", exact: true }).click();
  await page.getByLabel("Nome interno", { exact: true }).fill(model);
  await page.getByLabel("Assunto", { exact: true }).fill("Olá {{primeiro_nome}}");
  await page
    .getByLabel("Mensagem", { exact: true })
    .fill("Comunicado para {{nome}}. Conteúdo sintético.");
  await save(page);
  await page
    .getByRole("navigation", { name: "Áreas de mensagens" })
    .getByRole("link", { name: "Públicos", exact: true })
    .click();
  await page.getByRole("link", { name: "Novo público", exact: true }).click();
  await page.getByLabel("Nome interno", { exact: true }).fill(audience);
  await choose(page, "Selecionar destinatário", member);
  await save(page);
  await page.reload();
  await expect(page.getByText(member, { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Áreas de mensagens" })
    .getByRole("link", { name: "Campanhas", exact: true })
    .click();
  await page.getByRole("link", { name: "Nova campanha", exact: true }).click();
  await page.getByLabel("Nome interno", { exact: true }).fill(campaign);
  await choose(page, "Usar modelo", model);
  await expect(page.getByLabel("Assunto", { exact: true })).toHaveValue("Olá {{primeiro_nome}}");
  await page
    .getByRole("navigation", { name: "Áreas de mensagens" })
    .getByRole("link", { name: "Modelos", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Áreas de mensagens" })
    .getByRole("link", { name: "Campanhas", exact: true })
    .click();
  await page.getByRole("link", { name: "Nova campanha", exact: true }).click();
  await expect(page.getByLabel("Nome interno", { exact: true })).toHaveValue(campaign);
  await expect(page.getByLabel("Mensagem", { exact: true })).toHaveValue(
    "Comunicado para {{nome}}. Conteúdo sintético.",
  );
  await page.getByRole("button", { name: "Público", exact: true }).click();
  await choose(page, "Usar público salvo", audience);
  await expect(page.getByText(member, { exact: true })).toBeVisible();
  await save(page);
  const campaignUrl = page.url();
  await page.getByRole("button", { name: "Prévia", exact: true }).click();
  await page.getByRole("button", { name: "Atualizar prévia", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Olá Pessoa", exact: true })).toBeVisible();
  await expect(page.getByText("Para preparação", { exact: true })).toBeVisible();
  await expectWcag22AA(page);
  await expectThemeContrast(page, ".page-stack .button");
  await capture(page, {
    path: testInfo.outputPath("messages-preview-mobile-light.png"),
    fullPage: true,
  });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  await expectWcag22AA(page);
  await capture(page, {
    path: testInfo.outputPath("messages-preview-mobile-dark.png"),
    fullPage: true,
  });
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "light";
  });
  await page.getByRole("button", { name: "Solicitar envio agora", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectWcag22AA(page);
  await dialog
    .getByRole("button", { name: "Confirmar solicitação sem canal", exact: true })
    .click();
  await expect(
    page.getByText("Solicitação registrada como bloqueada. Nenhuma mensagem foi enviada.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bloqueada", exact: true })).toHaveCount(1);
  const future = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16);
  await page.getByLabel("Programar para", { exact: true }).fill(future);
  await page.getByRole("button", { name: "Revisar programação", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirmar programação", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cancelar programação", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancelar programação", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cancelada", exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Áreas de mensagens" })
    .getByRole("link", { name: "Preferências", exact: true })
    .click();
  await choose(page, "Selecionar associado", member);
  await page.getByLabel("Motivo do registro", { exact: true }).fill("Pedido sintético de bloqueio");
  await page.getByRole("button", { name: "Bloquear comunicações", exact: true }).click();
  await expect(page.getByText("Bloqueio geral registrado.", { exact: true })).toBeVisible();
  await page.goto(campaignUrl);
  await page.getByRole("button", { name: "Prévia", exact: true }).click();
  await page.getByRole("button", { name: "Atualizar prévia", exact: true }).click();
  await expect(
    page
      .locator("dl div")
      .filter({ has: page.getByText("Para preparação", { exact: true }) })
      .locator("dd"),
  ).toHaveText("0");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await capture(page, {
    path: testInfo.outputPath("messages-history-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Duplicar campanha", exact: true }).click();
  await expect(page).not.toHaveURL(campaignUrl);
  await expect(
    page.getByRole("heading", { name: `Cópia de ${campaign}`, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Nenhuma solicitação registrada.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Arquivar", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Restaurar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restaurar", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Arquivar", exact: true })).toBeVisible();
});
test("messages requires module access", async ({ page }) => {
  await login(page, false);
  await page.goto("/messages");
  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "Você não tem acesso ao módulo de mensagens.",
  );
  const response = await page.request.get("/api/v1/messages/campaigns");
  expect(response.status()).toBe(403);
});

test("a failed list offers retry without losing filters", async ({ page }) => {
  await login(page);
  let failed = false;
  await page.route("**/api/v1/messages/campaigns?**", (route) => {
    if (!failed) {
      failed = true;
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "UNAVAILABLE" } }),
      });
    }
    return route.continue();
  });
  await page.goto("/messages");
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Paginação", exact: true })).toBeVisible();
});
