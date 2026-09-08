import { expectWcag22AA } from "./accessibility";
import { expect, syntheticUsers, test } from "./fixtures";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test("login page meets the automated WCAG 2.2 AA baseline", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Acesse sua conta" })).toBeVisible();
  await expectWcag22AA(page);
});

test("authenticated shell meets the automated WCAG 2.2 AA baseline", async ({ page }) => {
  await signIn(page, syntheticUsers.ordinary.email, syntheticUsers.ordinary.password);
  await expect(page).toHaveURL(/\/$/);
  await expectWcag22AA(page);
});

test("MFA challenge meets the automated WCAG 2.2 AA baseline", async ({ page }) => {
  await signIn(page, syntheticUsers.administrator.email, syntheticUsers.administrator.password);
  await expect(page).toHaveURL(/\/mfa$/);
  await expectWcag22AA(page);
});
