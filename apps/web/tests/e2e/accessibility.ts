import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

export async function expectWcag22AA(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  if (results.violations.length) {
    throw new Error(`Accessibility violations:\n${JSON.stringify(results.violations, null, 2)}`);
  }
}

export async function expectThemeContrast(page: Page, selector: string) {
  const result = await page.locator("body").evaluate(async (module, selector) => {
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
        for (const button of module.querySelectorAll(selector)) {
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
  }, selector);
  expect(result.samples).toBeGreaterThan(0);
  expect(result.failures).toEqual([]);
}
