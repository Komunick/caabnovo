import { randomUUID } from "node:crypto";
import { expectWcag22AA } from "./accessibility";
import { expect, syntheticUsers, test } from "./fixtures";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("authorized manager creates, updates, grants, revokes and disables a user", async ({
  page,
}, testInfo) => {
  const suffix = randomUUID().slice(0, 8);
  const name = `Usuário Gerenciado ${suffix}`;
  const updatedName = `${name} Atualizado`;
  const email = `managed-${testInfo.project.name}-${suffix}@example.test`;
  await signIn(page, syntheticUsers.accessManager.email, syntheticUsers.accessManager.password);
  await page
    .getByRole("navigation", { name: "Navegação administrativa" })
    .getByRole("link", { name: "Usuários", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();
  await expectWcag22AA(page);

  const createButton = page.getByRole("button", { name: "Criar usuário" });
  await expect(createButton).toBeEnabled();
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Justificativa", { exact: true }).fill("Conta sintética para validação");
  await createButton.click();
  await expect(page).toHaveURL(/\/users\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name })).toBeVisible();

  const saveButton = page.getByRole("button", { name: "Salvar alterações" });
  await expect(saveButton).toBeEnabled();
  await expectWcag22AA(page);
  await page.getByLabel("Nome").fill(updatedName);
  await page.getByLabel("Justificativa", { exact: true }).fill("Correção cadastral sintética");
  await saveButton.click();
  await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();

  const grantButton = page.getByRole("button", { name: "Conceder função" });
  await expect(grantButton).toBeEnabled();
  await page.getByLabel("Função", { exact: true }).selectOption({ label: "Consulta de usuários" });
  await page.getByLabel("Justificativa da função").fill("Consulta temporária aprovada");
  await grantButton.click();
  await expect(page.getByText("Consulta de usuários", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Revogar Consulta de usuários" }).click();
  await page.getByLabel("Motivo da revogação").fill("Atividade concluída");
  await page.getByRole("button", { name: "Confirmar revogação" }).click();

  await page.getByRole("button", { name: "Desativar usuário" }).click();
  await page.getByLabel("Justificativa da desativação").fill("Conta sintética concluída");
  await page.getByRole("button", { name: "Confirmar desativação" }).click();
  await expect(page.getByText("Desativado", { exact: true })).toBeVisible();
});

test("ordinary user cannot open user administration", async ({ page }) => {
  await signIn(page, syntheticUsers.ordinary.email, syntheticUsers.ordinary.password);
  await expect(page.getByRole("link", { name: "Usuários", exact: true })).toHaveCount(0);
  await page.goto("/users");
  await expect(page.getByText("Você não tem permissão para acessar usuários.")).toBeVisible();
});
