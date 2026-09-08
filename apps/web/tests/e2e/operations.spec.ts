import { Client } from "pg";
import { expect, syntheticUsers, test } from "./fixtures";

const adminUrl =
  process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab";
const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.accessManager.email);
  await page.getByLabel("Senha").fill(syntheticUsers.accessManager.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("operator follows progress, sees safe failure and performs an authorized redrive", async ({
  page,
}) => {
  const database = new Client({ connectionString: adminUrl });
  await database.connect();
  const jobId = crypto.randomUUID();
  const fileId = crypto.randomUUID();
  try {
    await database.query(
      `INSERT INTO job_execution
        (id, job_type, queue_name, idempotency_key, correlation_id, request_id,
         aggregate_type, aggregate_id, status, progress, attempt_count, attempt_limit,
         safe_error_code, safe_error_message, started_at, finished_at)
       VALUES ($1, 'file-scan', 'file-scan', $2, gen_random_uuid(), gen_random_uuid(),
         'stored_file', $3, 'failed', 45, 1, 3, 'JOB_FAILED',
         'The operation could not be completed', now(), now())`,
      [jobId, `e2e-${jobId}`, fileId],
    );
    await signIn(page);
    await page
      .getByRole("navigation", { name: "Navegação administrativa" })
      .getByRole("link", { name: "Operações", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Processamentos" })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator(`a[href="/operations/jobs/${jobId}"]`).click();
    await expect(page.getByRole("heading", { name: "Estado: Falhou" })).toBeVisible();
    await expect(page.getByText("45% concluído")).toBeVisible();
    await expect(page.getByText("The operation could not be completed")).toBeVisible();
    await expect(page.getByText(/stack|password|token/i)).toHaveCount(0);

    await page.getByRole("button", { name: "Reenviar processamento" }).click();
    await page.getByLabel("Justificativa").fill("Nova tentativa aprovada no cenário sintético E2E");
    await page.getByRole("button", { name: "Confirmar reenvio" }).click();
    await expect(page.getByRole("heading", { name: "Estado: Na fila" })).toBeVisible();
  } finally {
    await database.end();
  }
});

test("quarantined upload remains private and unavailable for download", async ({ page }) => {
  await signIn(page);
  const checksum = "a".repeat(64);
  const intent = await page.request.post("/api/v1/files/upload-intents", {
    headers: {
      origin,
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    },
    data: {
      originalName: "evidence.png",
      declaredMime: "image/png",
      sizeBytes: 128,
      checksumSha256: checksum,
      ownerType: "e2e_case",
      ownerId: crypto.randomUUID(),
    },
  });
  expect(intent.status()).toBe(201);
  const grant = (await intent.json()) as { fileId: string; uploadUrl: string };
  expect(grant.uploadUrl).toContain("caab-quarantine");

  const blocked = await page.request.get(`/api/v1/files/${grant.fileId}/download`);
  expect(blocked.status()).toBe(409);
  await expect(blocked.json()).resolves.toMatchObject({
    code: "FILE_NOT_AVAILABLE",
    message: "Request conflicts with current state",
  });
});
