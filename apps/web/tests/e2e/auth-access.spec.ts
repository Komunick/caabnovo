import { expect, syntheticUsers, test } from "./fixtures";

test("ordinary user signs in, sees only authorized navigation, and signs out", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.ordinary.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Início" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Auditoria" })).toHaveCount(0);

  await page.getByRole("button", { name: /^Menu da conta de / }).click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("administrator signs in without an authenticator and settings have no MFA section", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/$/);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Configurações", exact: true })).toBeVisible();
  await expect(page.getByText(/MFA|autenticador|códigos de recuperação/i)).toHaveCount(0);
  expect(
    (
      await page.request.post("/api/auth/two-factor/enable", {
        data: { password: syntheticUsers.administrator.password },
      })
    ).status(),
  ).toBe(404);
});

test("a revoked session is rejected on the next protected navigation", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.ordinary.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);

  const response = await page.request.post("/api/test/revoke-current-session");
  expect(response.ok()).toBe(true);
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});
