import type { Locator } from "@playwright/test";
import { expect } from "./fixtures";

export async function expectExportAboveFilters(panel: Locator, action: Locator, filters: Locator) {
  await expect(action).toBeVisible();
  await expect(action).toHaveClass(/button--secondary/);
  const container = await panel.boundingBox();
  const button = await action.boundingBox();
  const controls = await filters.boundingBox();
  expect(container).not.toBeNull();
  expect(button).not.toBeNull();
  expect(controls).not.toBeNull();
  expect(button!.x).toBeGreaterThan(container!.x);
  expect(button!.x + button!.width).toBeLessThan(container!.x + container!.width);
  expect(button!.y).toBeGreaterThan(container!.y);
  expect(button!.y + button!.height).toBeLessThanOrEqual(controls!.y);
}
