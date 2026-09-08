import { expectWcag22AA } from "./accessibility";
import { expect, syntheticUsers, test } from "./fixtures";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
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
  await expectWcag22AA(page);

  await page.getByLabel("Ação", { exact: true }).fill("user.updated");
  await page.getByLabel("Tipo de entidade").fill("user");
  await page.getByRole("button", { name: "Pesquisar" }).click();
  await expect(page.getByText("user.updated", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Editar|Excluir/ })).toHaveCount(0);

  await page.getByRole("button", { name: "Exportar auditoria" }).click();
  await page.getByLabel("Justificativa da exportação").fill("Investigação sintética autorizada");
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
});
