import { Client } from "pg";
import { readFile } from "node:fs/promises";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
import { readCsv, readXlsx, readPdf } from "../helpers/read-export";
import type { Page } from "@playwright/test";
async function login(
  page: Page,
  email: string = syntheticUsers.administrator.email,
  password: string = syntheticUsers.administrator.password,
) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}
function db() {
  return new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
}
test("direct exports keep filters and keyboard column order and download 100 records in all formats", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  const sql = db();
  await sql.connect();
  const prefix = `Exportação ${crypto.randomUUID().slice(0, 8)}`;
  try {
    await sql.query(
      `INSERT INTO "user"(name,email) SELECT $1||' '||lpad(n::text,3,'0'),$2||n||'@example.test' FROM generate_series(1,100)n`,
      [prefix, crypto.randomUUID()],
    );
    await login(page);
    await page.goto("/users");
    await page.getByRole("link", { name: "Exportar colaboradores", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Exportar colaboradores", exact: true }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Nome", exact: true }).fill(prefix);
    await page.getByRole("button", { name: "Mover E-mail para cima", exact: true }).focus();
    await page.keyboard.press("Enter");
    const samples: number[] = [];
    for (const [format, label] of [
      ["xlsx", "Excel"],
      ["csv", "CSV"],
      ["pdf", "PDF"],
    ] as const) {
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: `Exportar em ${label}`, exact: true }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${format}$`));
      expect(await download.failure()).toBeNull();
      const file = await download.path();
      expect(file).toBeTruthy();
      const bytes = await readFile(file!);
      if (format === "csv") {
        const rows = readCsv(bytes);
        expect(rows[0]!.slice(0, 2)).toEqual(["E-mail", "Nome"]);
        expect(rows).toHaveLength(101);
        expect(rows.every((r, n) => n === 0 || r[1]!.startsWith(prefix))).toBe(true);
      }
      if (format === "xlsx") {
        const rows = readXlsx(bytes)[1]!;
        expect(rows[0]!.slice(0, 2)).toEqual(["E-mail", "Nome"]);
        expect(rows).toHaveLength(101);
      }
      if (format === "pdf") {
        const text = (await readPdf(bytes)).join(" ");
        for (let n = 1; n <= 100; n++)
          expect(text).toContain(`${prefix} ${String(n).padStart(3, "0")}`);
      }
      await expect(
        page.getByRole("status").filter({ hasText: "Geração e transferência concluídas" }),
      ).toContainText("100 registros");
      await expect(page.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue(prefix);
      for (let n = 0; n < 10; n++) {
        const start = performance.now();
        await page.goto("/users");
        await expect(
          page.getByRole("heading", { name: "Colaboradores", exact: true }),
        ).toBeVisible();
        samples.push(performance.now() - start);
      }
      await page.getByRole("link", { name: "Exportar colaboradores", exact: true }).click();
      // Hard navigation deliberately starts a new workspace; restore this test's filter.
      await page.getByRole("textbox", { name: "Nome", exact: true }).fill(prefix);
      if (format !== "pdf") {
        await page.getByRole("button", { name: "Mover E-mail para cima", exact: true }).click();
      }
    }
    const sorted = [...samples].sort((a, b) => a - b),
      p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]!;
    await testInfo.attach("export-panel-profile", {
      body: JSON.stringify({
        samples,
        p95,
        records: 100,
        node: process.version,
        scope: "30 normal page openings in the export validation round",
      }),
      contentType: "application/json",
    });
    expect(p95).toBeLessThanOrEqual(2000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("caab-theme", theme);
      }, theme);
      await expectWcag22AA(page);
      await page.screenshot({
        path: testInfo.outputPath(`export-${theme}-390.png`),
        fullPage: true,
      });
    }
    await page
      .getByRole("textbox", { name: "Nome", exact: true })
      .fill("Sem resultado " + crypto.randomUUID());
    const empty = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar em CSV", exact: true }).click();
    const downloaded = await empty;
    expect(readCsv(await readFile((await downloaded.path())!))).toHaveLength(1);
  } finally {
    await sql.end();
  }
});
test("general export alone exposes no administrative module and revocation hides navigation search and home", async ({
  page,
}) => {
  test.setTimeout(90000);
  await login(page);
  const email = `partial-export-${crypto.randomUUID()}@example.test`;
  const created = await page.request.post("/api/v1/users", {
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    },
    data: { name: "Colaborador parcial sintético", email, roleIds: [] },
  });
  expect(created.status()).toBe(201);
  const body = await created.json();
  const sql = db();
  await sql.connect();
  const user = body.user ?? body;
  const id = user.id;
  await sql.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['exports:generate'],$1) ON CONFLICT(user_id) DO UPDATE SET permissions=EXCLUDED.permissions",
    [id],
  );
  const context = await page
    .context()
    .browser()!
    .newContext({ baseURL: new URL(page.url()).origin });
  const partial = await context.newPage();
  try {
    await login(partial, email, body.initialPassword);
    for (const route of [
      "users",
      "members",
      "scheduling",
      "news",
      "partners",
      "reports",
      "messages",
      "audit",
    ])
      await expect(partial.locator(`a[href^="/${route}"]`)).toHaveCount(0);
    await partial.keyboard.press("Control+k");
    const search = partial.getByRole("dialog", { name: "Navegação rápida" });
    await search.getByLabel("Buscar funções e áreas").fill("exportar");
    await expect(search.getByRole("link")).toHaveCount(0);
    await partial.keyboard.press("Escape");
    await sql.query(
      "UPDATE user_access SET permissions=ARRAY['exports:generate','users:read','members:read'] WHERE user_id=$1",
      [id],
    );
    await partial.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(
      partial
        .getByRole("navigation", { name: "Navegação administrativa" })
        .getByRole("link", { name: "Associados", exact: true }),
    ).toBeVisible();
    await partial.goto("/users/exportar");
    await expect(partial.getByRole("heading", { name: "Exportar colaboradores" })).toBeVisible();
    await expect(partial.getByRole("checkbox", { name: "Funções", exact: true })).toHaveCount(0);
    await sql.query(
      "UPDATE user_access SET permissions=ARRAY['exports:generate'] WHERE user_id=$1",
      [id],
    );
    await partial.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(partial.getByRole("heading", { name: "Exportar colaboradores" })).toHaveCount(0);
    await partial.goto("/");
    await expect(
      partial.locator('a[href^="/users"],a[href^="/members"],a[href^="/scheduling"]'),
    ).toHaveCount(0);
  } finally {
    await context.close();
    await sql.end();
  }
});
