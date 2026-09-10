import { expect, type Locator, type Page } from "@playwright/test";

export async function tabTo(page: Page, target: Locator) {
  // Accessibility scans open a temporary page; reactivate this page before typing.
  await page.bringToFront();
  await expect(target).toBeVisible();
  await expect(target).toBeEnabled();
  const backwardsFirst = await target.evaluate((element) =>
    Boolean(
      element.compareDocumentPosition(document.activeElement!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  );
  const visited = new Set<string>();
  for (let count = 0; count < 100; count++) {
    const focus = await target.evaluate((element) => ({
      reached: element === document.activeElement,
      control: `${document.activeElement?.tagName}#${document.activeElement?.id}:${document.activeElement?.getAttribute("aria-label") ?? ""}`,
    }));
    if (focus.reached) return;
    visited.add(focus.control);
    // Headless Firefox does not wrap past the last control. Check both directions.
    const backwards = count < 50 ? backwardsFirst : !backwardsFirst;
    const key = backwards ? "Shift+Tab" : "Tab";
    await page.keyboard.press(key);
  }
  throw new Error(
    `The control could not be reached by keyboard: ${target}. Visited: ${[...visited].join(", ")}`,
  );
}

export async function keyboardActivate(page: Page, target: Locator) {
  await tabTo(page, target);
  await page.keyboard.press("Enter");
}

export async function keyboardType(page: Page, target: Locator, value: string) {
  await tabTo(page, target);
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.insertText(value);
}
