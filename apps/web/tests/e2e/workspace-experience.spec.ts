import { expect, syntheticUsers, test } from "./fixtures";

async function signIn(
  page: import("@playwright/test").Page,
  user: (typeof syntheticUsers)[keyof typeof syntheticUsers],
) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("theme preference persists and quick navigation respects permissions", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => localStorage.setItem("caab-theme", "light"));
  await signIn(page, syntheticUsers.ordinary);

  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Ativar tema claro" })).toBeVisible();

  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Navegação rápida" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Sessões/ })).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Colaboradores/ })).toHaveCount(0);

  await dialog.getByLabel("Buscar área").fill("sessões");
  await dialog.getByRole("link", { name: /Sessões/ }).click();
  await expect(page).toHaveURL(/\/sessions$/);
});

test("sidebar collapses on desktop and opens as a mobile drawer", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, syntheticUsers.accessManager);

  const administrativeNavigation = page.getByRole("navigation", {
    name: "Navegação administrativa",
  });
  await expect(
    administrativeNavigation.getByRole("link", { name: "Auditoria", exact: true }),
  ).toHaveCount(1);
  await expect(
    administrativeNavigation.getByRole("link", { name: "Operações", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".module-card").filter({ hasText: "Auditoria" })).toHaveCount(1);

  const shell = page.locator(".admin-shell");
  await page.getByRole("button", { name: "Recolher menu lateral" }).click();
  await expect(shell).toHaveClass(/admin-shell--collapsed/);
  await expect(page.getByRole("button", { name: "Expandir menu lateral" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Buscar área", exact: true }).click();
  const quickNavigation = page.getByRole("dialog", { name: "Navegação rápida" });
  await expect(quickNavigation).toBeVisible();
  await quickNavigation.getByLabel("Buscar área").fill("operações");
  await expect(quickNavigation.getByRole("link")).toHaveCount(1);
  await expect(quickNavigation.getByRole("link", { name: /Auditoria/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(quickNavigation).toBeHidden();
  const menuButton = page.getByRole("button", { name: "Abrir menu de navegação" });
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(shell).toHaveClass(/admin-shell--mobile-open/);

  await page.getByRole("link", { name: "Auditoria", exact: true }).click();
  await expect(page).toHaveURL(/\/audit$/);
  await expect(shell).not.toHaveClass(/admin-shell--mobile-open/);
});
