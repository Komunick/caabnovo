import { Client } from "pg";
import { expectWcag22AA } from "./accessibility";
import { expect, syntheticUsers, test } from "./fixtures";

const adminUrl =
  process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab";
const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test("operator filters and pages through jobs with keyboard, mobile and recoverable invalid URLs", async ({
  page,
}, testInfo) => {
  const database = new Client({ connectionString: adminUrl });
  await database.connect();
  const jobType = `Verificação sintética ${crypto.randomUUID().slice(0, 8)}`;
  try {
    await database.query(
      `INSERT INTO job_execution(job_type,queue_name,idempotency_key,correlation_id,status,attempt_limit,created_at)
      SELECT $1,'synthetic-page',n::text,gen_random_uuid(),CASE WHEN n<=31 THEN 'failed'::job_status ELSE 'succeeded'::job_status END,3,
        '2026-09-15T10:00:00.123456Z'::timestamptz FROM generate_series(1,34) n`,
      [jobType],
    );
    await signIn(page);
    await page.goto("/audit/jobs");
    await page.getByLabel("Tipo", { exact: true }).fill(jobType);
    await page.getByLabel("Estado", { exact: true }).selectOption("failed");
    await page.getByRole("button", { name: "Aplicar filtros" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("25 processamentos nesta página.")).toBeVisible();
    const firstIds = await page
      .locator('tbody a[href^="/audit/jobs/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    await expectWcag22AA(page);
    await page.screenshot({
      path: testInfo.outputPath("jobs-filters-desktop.png"),
      fullPage: true,
    });
    await page.getByRole("link", { name: "Próxima", exact: true }).click();
    await expect(page.getByText("6 processamentos nesta página.")).toBeVisible();
    await expect(page.getByLabel("Tipo", { exact: true })).toHaveValue(jobType);
    await expect(page.getByLabel("Estado", { exact: true })).toHaveValue("failed");
    const lastIds = await page
      .locator('tbody a[href^="/audit/jobs/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(new Set([...firstIds, ...lastIds]).size).toBe(31);
    await expect(page.getByRole("link", { name: "Próxima", exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Primeira página" }).click();
    await expect(page.getByText("25 processamentos nesta página.")).toBeVisible();
    await page.getByLabel("Estado", { exact: true }).selectOption("succeeded");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByText("3 processamentos nesta página.")).toBeVisible();
    expect(new URL(page.url()).searchParams.has("cursor")).toBe(false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "dark" });
    await expectWcag22AA(page);
    await page.screenshot({ path: testInfo.outputPath("jobs-filters-mobile.png"), fullPage: true });
    await page.getByLabel("Estado", { exact: true }).selectOption("running");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByText("Nenhum processamento encontrado nesta consulta.")).toBeVisible();
    await page.getByRole("link", { name: "Limpar filtros" }).click();
    await expect(page.getByLabel("Tipo", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Estado", { exact: true })).toHaveValue("");
    await page.goto("/audit/jobs?cursor=invalid&status=failed");
    await expect(page.getByRole("alert")).toContainText("inválidos");
    await page.getByRole("link", { name: "Reiniciar consulta" }).click();
    await expect(page.getByRole("heading", { name: "Processamentos", exact: true })).toBeVisible();
  } finally {
    await database.query("DELETE FROM job_execution WHERE job_type=$1", [jobType]);
    await database.end();
  }
});

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.accessManager.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.accessManager.password);
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
      .getByRole("link", { name: "Auditoria", exact: true })
      .click();
    await page
      .getByRole("navigation", { name: "Áreas de auditoria" })
      .getByRole("link", { name: "Processamentos", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Processamentos" })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator(`a[href="/audit/jobs/${jobId}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/audit/jobs/${jobId}$`));
    await page.goto(`/operations/jobs/${jobId}`);
    await expect(page).toHaveURL(new RegExp(`/audit/jobs/${jobId}$`));
    await expect(page.getByRole("heading", { name: "Estado: Falhou" })).toBeVisible();
    await expect(page.getByText("45% concluído")).toBeVisible();
    await expect(page.getByText("The operation could not be completed")).toBeVisible();
    await expect(page.getByText(/stack|password|token/i)).toHaveCount(0);

    await page.getByRole("button", { name: "Reenviar processamento" }).click();
    await expect(page.getByLabel("Justificativa")).toHaveCount(0);
    const redriveResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/v1/jobs/${jobId}/redrive`) &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Confirmar reenvio" }).click();
    const redriveResponse = await redriveResponsePromise;
    expect(redriveResponse.status()).toBe(202);
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(
      page.getByRole("heading", {
        name: /Estado: (Na fila|Em andamento|Concluído|Falhou)/,
      }),
    ).toBeVisible();
    const attemptCount = page
      .locator(".audit-metadata dt", { hasText: "Tentativas" })
      .locator("+ dd");
    await expect(attemptCount).toHaveText(/^[12]$/);
  } finally {
    await database.end();
  }
});

test("job-only operator uses the consolidated area without gaining audit access", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.operator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.operator.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
  const navigation = page.getByRole("navigation", { name: "Navegação administrativa" });
  await expect(navigation.getByRole("link", { name: "Operações", exact: true })).toHaveCount(0);
  const audit = navigation.getByRole("link", { name: "Auditoria", exact: true });
  await expect(audit).toHaveAttribute("href", "/audit/jobs");
  await audit.click();
  await expect(page.getByRole("heading", { name: "Processamentos", exact: true })).toBeVisible();
  const sections = page.getByRole("navigation", { name: "Áreas de auditoria" });
  await expect(sections.getByRole("link", { name: "Eventos", exact: true })).toHaveCount(0);
  await expect(sections.getByRole("link", { name: "Processamentos", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expectWcag22AA(page);
  expect((await page.request.get("/api/v1/audit-events")).status()).toBe(403);
  await page.goto("/audit");
  await expect(page).toHaveURL(/\/audit\/jobs$/);
  await page.goto("/operations/jobs");
  await expect(page).toHaveURL(/\/audit\/jobs$/);
  await expect(page.getByRole("button", { name: "Reenviar processamento" })).toHaveCount(0);
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
  const uploadUrl = new URL(grant.uploadUrl);
  expect(uploadUrl.origin).toBe(new URL(origin).origin);
  expect(uploadUrl.pathname).toBe("/api/v1/files/content");
  const wrongMethod = await page.request.get(grant.uploadUrl);
  expect(wrongMethod.status()).toBe(403);

  const blocked = await page.request.get(`/api/v1/files/${grant.fileId}/download`);
  expect(blocked.status()).toBe(409);
  await expect(blocked.json()).resolves.toMatchObject({
    code: "FILE_NOT_AVAILABLE",
    message: "Request conflicts with current state",
  });
});
