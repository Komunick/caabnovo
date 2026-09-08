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
