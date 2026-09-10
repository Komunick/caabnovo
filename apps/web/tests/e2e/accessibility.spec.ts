import { expectWcag22AA } from "./accessibility";
import { expect, syntheticUsers, test } from "./fixtures";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
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

test("administrator account settings without MFA meet the automated WCAG 2.2 AA baseline", async ({
  page,
}) => {
  await signIn(page, syntheticUsers.administrator.email, syntheticUsers.administrator.password);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Configurações", exact: true })).toBeVisible();
  await expect(page.getByText(/MFA|autenticador|códigos de recuperação/i)).toHaveCount(0);
  await expectWcag22AA(page);
});

test("user administration meets the automated WCAG 2.2 AA baseline", async ({ page }) => {
  await signIn(page, syntheticUsers.accessManager.email, syntheticUsers.accessManager.password);
  await page.goto("/users");
  await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();
  await expectWcag22AA(page);
});

test("news buttons retain readable contrast throughout light and dark theme changes", async ({
  page,
}) => {
  await signIn(page, syntheticUsers.ordinary.email, syntheticUsers.ordinary.password);
  await page.goto("/news/drafts");
  await expect(page.getByRole("link", { name: "Nova notícia", exact: true })).toBeVisible();
  const result = await page.locator(".news-module").evaluate(async (module) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true })!;
    function channels(color: string) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return [r!, g!, b!, a! / 255];
    }
    function luminance(color: number[]) {
      return color
        .slice(0, 3)
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0);
    }
    function background(element: Element) {
      const layers: number[][] = [];
      for (let node: Element | null = element; node; node = node.parentElement) {
        const color = channels(getComputedStyle(node).backgroundColor);
        layers.push(color);
        if ((color[3] ?? 1) === 1) break;
      }
      return layers.reverse().reduce(
        (below, layer) => {
          const alpha = layer[3] ?? 1;
          return layer.slice(0, 3).map((value, i) => value * alpha + below[i]! * (1 - alpha));
        },
        [255, 255, 255],
      );
    }
    let samples = 0;
    const failures: { text: string | null; theme: string; ratio: number }[] = [];
    for (const theme of ["dark", "light"]) {
      document.documentElement.dataset.theme = theme;
      const start = performance.now();
      do {
        await new Promise(requestAnimationFrame);
        for (const button of module.querySelectorAll(".button")) {
          if (!button.getClientRects().length || button.matches(":disabled")) continue;
          const style = getComputedStyle(button);
          const fg = luminance(channels(style.color)),
            bg = luminance(background(button));
          const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
          samples++;
          if (ratio < 4.5) failures.push({ text: button.textContent, theme, ratio });
        }
      } while (performance.now() - start < 250);
    }
    return { samples, failures };
  });
  expect(result.samples).toBeGreaterThan(0);
  expect(result.failures).toEqual([]);
});

test("audit results and export dialog meet the automated WCAG 2.2 AA baseline", async ({
  page,
}) => {
  await signIn(page, syntheticUsers.auditor.email, syntheticUsers.auditor.password);
  await page.goto("/audit");
  await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
  await expectWcag22AA(page);
  await page.getByRole("button", { name: "Exportar auditoria" }).click();
  await expect(page.getByRole("dialog", { name: "Exportar auditoria" })).toBeVisible();
  await expectWcag22AA(page);
});
