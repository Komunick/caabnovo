import { expectWcag22AA } from "./accessibility";
import { expect, syntheticUsers, test } from "./fixtures";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("auditor searches combined filters and starts an authorized export", async ({ page }) => {
  await signIn(page, syntheticUsers.auditor.email, syntheticUsers.auditor.password);
  await page
    .getByRole("navigation", { name: "Navegação administrativa" })
    .getByRole("link", { name: "Auditoria", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Áreas de auditoria" })
      .getByRole("link", { name: "Processamentos", exact: true }),
  ).toHaveCount(0);
  await expectWcag22AA(page);

  await page.getByLabel("Ação", { exact: true }).selectOption("user.updated");
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByLabel("Área", { exact: true }).selectOption("user");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(
    page
      .getByText(
        "Colaborador não identificado alterou o cadastro de colaborador não identificado",
        { exact: true },
      )
      .first(),
  ).toBeVisible();
  await expect(page.getByText("user.updated", { exact: true }).first()).toBeHidden();
  await page.getByText("Detalhes técnicos", { exact: true }).first().click();
  await expect(page.getByText("user.updated", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Editar|Excluir/ })).toHaveCount(0);

  await page.getByRole("button", { name: "Exportar auditoria" }).click();
  await expect(page.getByLabel("Justificativa da exportação")).toHaveCount(0);
  await page.getByRole("button", { name: "Iniciar exportação" }).click();
  await expect(page).toHaveURL(/\/audit\/exports\/[0-9a-f-]+$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Exportação de auditoria" })).toBeVisible();
  await expect(page.getByText(/Na fila|Em processamento|Concluída/)).toBeVisible();
});

test("ordinary user cannot access audit search or export", async ({ page }) => {
  await signIn(page, syntheticUsers.ordinary.email, syntheticUsers.ordinary.password);
  await expect(page.getByRole("link", { name: "Auditoria", exact: true })).toHaveCount(0);
  await page.goto("/audit");
  await expect(page.getByText("Você não tem permissão para acessar a auditoria.")).toBeVisible();

  const response = await page.request.post("/api/v1/audit-exports", {
    headers: {
      origin,
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    },
    data: {
      from: new Date(Date.now() - 60_000).toISOString(),
      to: new Date().toISOString(),
      justification: "Tentativa sintética",
    },
  });
  expect(response.status()).toBe(403);
  await page.goto("/audit/jobs");
  await expect(page.getByText("Você não tem permissão para acessar processamentos.")).toBeVisible();
});

test("authorized administrator reads plain descriptions and opens original details on mobile", async ({
  page,
}, testInfo) => {
  await signIn(page, syntheticUsers.administrator.email, syntheticUsers.administrator.password);
  await page.goto("/audit?action=user.updated&entityType=user");
  const description = "Gestor de Acesso Sintético alterou o cadastro de Gestor de Acesso Sintético";
  await expect(page.getByText(description, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("user.updated", { exact: true }).first()).toBeHidden();
  await expectWcag22AA(page);
  await page.screenshot({ path: testInfo.outputPath("audit-plain-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  const details = page
    .getByText(description, { exact: true })
    .first()
    .locator("xpath=ancestor::tr")
    .locator("summary");
  await details.focus();
  await page.keyboard.press("Enter");
  await expect(
    page
      .getByText(description, { exact: true })
      .first()
      .locator("xpath=ancestor::tr")
      .getByText("user.updated", { exact: true }),
  ).toBeVisible();
  await expectWcag22AA(page);
  await page.screenshot({
    path: testInfo.outputPath("audit-plain-mobile-dark.png"),
    fullPage: true,
  });
  await page.goto("/audit?action=legacy.unknown&entityType=legacy_record");
  await expect(page.getByLabel("Ação", { exact: true })).toHaveValue("legacy.unknown");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL(/action=legacy.unknown&entityType=legacy_record/);
  await expect(
    page.getByText("Nenhum evento encontrado para os filtros informados."),
  ).toBeVisible();
});

test("auditor cannot inspect processing data through the consolidated routes", async ({ page }) => {
  await signIn(page, syntheticUsers.auditor.email, syntheticUsers.auditor.password);
  await page.goto("/audit/jobs");
  await expect(page.getByText("Você não tem permissão para acessar processamentos.")).toBeVisible();
  const jobId = crypto.randomUUID();
  await page.goto(`/audit/jobs/${jobId}`);
  await expect(
    page.getByText("Você não tem permissão para acessar este processamento."),
  ).toBeVisible();
  expect((await page.request.get(`/api/v1/jobs/${jobId}`)).status()).toBe(403);
});
