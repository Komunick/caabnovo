import { expectExportAboveFilters } from "./panel-actions";
import type { Page } from "@playwright/test";
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

  await expect(page.getByRole("combobox", { name: "Pessoa", exact: true })).toHaveCount(0);
  expect((await page.request.get("/api/v1/audit-actors?q=Gestor")).status()).toBe(403);
  await page.getByLabel("Área", { exact: true }).fill("Colaborador");
  const actionField = page.getByLabel("Ação", { exact: true });
  await expect(actionField).toHaveAttribute("list", "audit-action-options");
  await actionField.fill("opção inexistente");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByText("Escolha uma opção da lista ou limpe o campo.")).toBeVisible();
  await actionField.fill("Alterou um colaborador");
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
  await page
    .getByRole("button", { name: /^Ver atividade:/ })
    .first()
    .click();
  const detail = page.getByRole("dialog", { name: "Detalhes da atividade" });
  await expect(detail.getByRole("heading", { name: "O que foi registrado" })).toBeVisible();
  await expect(detail.getByText("user.updated", { exact: true })).toBeHidden();
  await detail.getByText("Informações para suporte", { exact: true }).click();
  await expect(detail.getByText("user.updated", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Editar|Excluir/ })).toHaveCount(0);
  await page.keyboard.press("Escape");

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

test("administrator reads complete human details with support codes collapsed on desktop and mobile", async ({
  page,
}, testInfo) => {
  await signIn(page, syntheticUsers.administrator.email, syntheticUsers.administrator.password);
  await page.goto("/audit?action=user.updated&entityType=user");
  const description = "Gestor de Acesso Sintético alterou o cadastro de Gestor de Acesso Sintético";
  await expect(page.getByText(description, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("user.updated", { exact: true }).first()).toBeHidden();
  await expectWcag22AA(page);
  const filtersPanel = page.getByRole("region", { name: "Filtros de atividades", exact: true });
  const exportAction = filtersPanel.getByRole("button", {
    name: "Exportar auditoria",
    exact: true,
  });
  await expectExportAboveFilters(filtersPanel, exportAction, filtersPanel.locator("form"));
  await page.screenshot({
    animations: "disabled",
    path: testInfo.outputPath("audit-plain-desktop.png"),
    fullPage: true,
  });
  const person = page.getByRole("combobox", { name: "Pessoa", exact: true });
  await person.fill("Gestor de Acesso");
  await expect(
    page.getByRole("option", { name: "Gestor de Acesso Sintético", exact: true }),
  ).toBeVisible();
  await person.press("ArrowDown");
  await person.press("Enter");
  await page.getByLabel("Período", { exact: true }).selectOption("week");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/actorId=/);
  await expect(page).toHaveURL(/period=week/);
  const details = page
    .getByRole("button", { name: `Ver atividade: ${description}`, exact: true })
    .first();
  await details.focus();
  await page.keyboard.press("Enter");
  const panel = page.getByRole("dialog", { name: "Detalhes da atividade" });
  await expect(panel).toBeVisible();
  await expectDialogAboveHeader(page, "backdrop");
  await expect(panel.getByText("Antes", { exact: true }).first()).toBeVisible();
  await expect(panel.getByText("Depois", { exact: true }).first()).toBeVisible();
  await expect(panel.getByText("Inativo", { exact: true })).toBeVisible();
  await expect(panel.getByText("Ativo", { exact: true })).toBeVisible();
  await expect(panel.getByText("Nome anterior sintético", { exact: true })).toHaveCount(0);
  await expect(panel.getByText("user.updated", { exact: true })).toBeHidden();
  await expect(panel.locator("pre").first()).toBeHidden();
  expect(await panel.innerText()).not.toMatch(/roleId|requestId|[0-9a-f]{8}-[0-9a-f]{4}-/);
  await expectWcag22AA(page);
  await page.screenshot({
    animations: "disabled",
    path: testInfo.outputPath("audit-plain-detail-desktop.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(details).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await expectExportAboveFilters(filtersPanel, exportAction, filtersPanel.locator("form"));
  await expectWcag22AA(page);
  await page.screenshot({
    animations: "disabled",
    path: testInfo.outputPath("audit-plain-list-mobile-dark.png"),
    fullPage: true,
  });
  await details.click();
  await expectDialogAboveHeader(page, "dialog");
  await expect(panel.getByText("user.updated", { exact: true })).toBeHidden();
  await expectWcag22AA(page);
  expect(await panel.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThan(
    350,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    animations: "disabled",
    path: testInfo.outputPath("audit-plain-mobile-dark.png"),
    fullPage: true,
  });
  await panel.getByText("Informações para suporte", { exact: true }).click();
  await expect(panel.getByText("user.updated", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/audit?action=legacy.unknown&entityType=legacy_record");
  await expect(page.getByLabel("Ação", { exact: true })).toHaveValue(
    "Atividade do registro antigo",
  );
  await page.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(page).toHaveURL(/action=legacy.unknown&entityType=legacy_record/);
  await expect(page.getByRole("heading", { name: "Nenhuma atividade encontrada" })).toBeVisible();
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

async function expectDialogAboveHeader(page: Page, expectedLayer: string) {
  const layer = await page.locator(".admin-topbar").evaluate((header) => {
    const previous = header.style.pointerEvents;
    // Enable hit testing briefly so an incorrectly painted, inert header cannot hide the regression.
    header.style.pointerEvents = "auto";
    try {
      const bounds = header.getBoundingClientRect();
      const top = document.elementFromPoint(bounds.left + 8, bounds.top + 8);
      return top?.closest(".dialog-card")
        ? "dialog"
        : top?.closest(".dialog-backdrop")
          ? "backdrop"
          : "header";
    } finally {
      header.style.pointerEvents = previous;
    }
  });
  expect(layer).toBe(expectedLayer);
}
