import { expect, syntheticUsers, test } from "./fixtures";

test("ordinary user signs in, sees only authorized navigation, and signs out", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
  await page.getByLabel("Senha").fill(syntheticUsers.ordinary.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Início" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Auditoria" })).toHaveCount(0);

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("administrator must complete MFA before administrative navigation", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha").fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/mfa$/);
  await page.getByLabel("Código de verificação").fill("000000");
  await page.getByRole("button", { name: "Verificar" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("Código inválido");
  await expect(page).toHaveURL(/\/mfa$/);
});

test("a revoked session is rejected on the next protected navigation", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
  await page.getByLabel("Senha").fill(syntheticUsers.ordinary.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);

  const response = await page.request.post("/api/test/revoke-current-session");
  expect(response.ok()).toBe(true);
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});
