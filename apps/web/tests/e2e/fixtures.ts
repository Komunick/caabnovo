import { test as base, expect } from "@playwright/test";

export const syntheticUsers = {
  ordinary: { email: "ordinary@example.test", password: "Synthetic-Only-Password-1!" },
  accessManager: { email: "manager@example.test", password: "Synthetic-Only-Password-3!" },
  auditor: { email: "auditor@example.test", password: "Synthetic-Only-Password-4!" },
  administrator: { email: "admin@example.test", password: "Synthetic-Only-Password-2!" },
} as const;

export const test = base.extend<{ requestCorrelationId: string }>({
  requestCorrelationId: async ({ page }, use) => {
    const correlationId = crypto.randomUUID();
    await page.setExtraHTTPHeaders({ "x-correlation-id": correlationId });
    await use(correlationId);
  },
});

export { expect };
