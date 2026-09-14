import type { Page } from "@playwright/test";

/** Supply the reason when a journey edits an existing record or confirms a change. */
export async function justifyNewsChange(page: Page) {
  const ids = (await page.getByRole("dialog").isVisible())
    ? ["news-command-reason"]
    : ["news-reason", "news-publication-reason"];
  for (const id of ids) {
    const field = page.locator(`#${id}`);
    if ((await field.isVisible()) && (await field.isEnabled()))
      await field.fill("Alteração editorial sintética autorizada");
  }
}
