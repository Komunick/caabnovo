import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "tablet", use: { ...devices["iPad Pro 11"] } },
  ],
  webServer: {
    command: "corepack pnpm --filter @caab/web build && corepack pnpm --filter @caab/web start",
    url: "http://127.0.0.1:3000/livez",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      E2E_TEST_MODE: "1",
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://caab_runtime:change-me-runtime@127.0.0.1:5432/caab",
      DATABASE_ADMIN_URL:
        process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "e2e-only-secret-with-at-least-32-characters",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      S3_ENDPOINT: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000",
      S3_REGION: process.env.S3_REGION ?? "us-east-1",
      S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "caab-local",
      S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "e2e-only-storage-secret",
      S3_QUARANTINE_BUCKET: process.env.S3_QUARANTINE_BUCKET ?? "caab-quarantine",
      S3_PRIVATE_BUCKET: process.env.S3_PRIVATE_BUCKET ?? "caab-private",
      S3_PUBLIC_BUCKET: process.env.S3_PUBLIC_BUCKET ?? "caab-public",
      CLAMAV_HOST: process.env.CLAMAV_HOST ?? "127.0.0.1",
      CLAMAV_PORT: process.env.CLAMAV_PORT ?? "3310",
      OTEL_EXPORTER_OTLP_ENDPOINT:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://127.0.0.1:4318",
    },
  },
});
