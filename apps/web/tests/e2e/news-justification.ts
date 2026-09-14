import type { Page } from "@playwright/test";
import { expect } from "./fixtures";

export async function expectNoNewsReasonFields(page: Page) {
  await expect(
    page.locator("#news-reason, #news-publication-reason, #news-command-reason"),
  ).toHaveCount(0);
}
