import { expect, syntheticUsers, test } from "./fixtures";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("keyboard users can skip directly to the administrative content", async ({
  page,
  browserName,
}, testInfo) => {
  await signIn(page, syntheticUsers.ordinary.email, syntheticUsers.ordinary.password);
  await page.goto("/");
  const skipLink = page.getByRole("link", { name: "Pular para o conteúdo" });
  if (browserName === "webkit" || testInfo.project.name === "tablet") {
    // WebKit/iPad honor the host setting that may omit links from the Tab cycle.
    await skipLink.focus();
  } else {
    await page.keyboard.press("Tab");
  }
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("audit export dialog receives and traps keyboard focus", async ({ page }) => {
  await signIn(page, syntheticUsers.auditor.email, syntheticUsers.auditor.password);
  await page.goto("/audit");
  const trigger = page.getByRole("button", { name: "Exportar auditoria" });
  await expect(trigger).toBeEnabled();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Exportar auditoria" });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Início")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Fechar" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("essential pages reflow at 320 CSS pixels without page-level horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page, syntheticUsers.auditor.email, syntheticUsers.auditor.password);
  await page.goto("/audit");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);

  await page.setViewportSize({ width: 320, height: 800 });
  await page.addStyleTag({ content: "html { font-size: 100%; }" });
  await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});
