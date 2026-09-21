import { syntheticUserContact } from "../helpers/user-contact";
import { Client } from "pg";
import { readFile, writeFile } from "node:fs/promises";
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
  const monitor = await page.context().newPage();
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
    // Reject a tampered request in the real endpoint, then retry with the intact form.
    await page.route(
      "**/api/v1/exports/download",
      async (route) => {
        const body = new URLSearchParams(route.request().postData()!);
        const input = JSON.parse(body.get("config")!);
        input.columns.push("passwordHash");
        body.set("config", JSON.stringify(input));
        await route.continue({ postData: body.toString() });
      },
      { times: 1 },
    );
    await page.getByRole("button", { name: "Exportar em CSV", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Confira os filtros e as colunas selecionadas" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue(prefix);
    const samples: number[] = [];
    for (const [format, label] of [
      ["xlsx", "Excel"],
      ["csv", "CSV"],
      ["pdf", "PDF"],
    ] as const) {
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: `Exportar em ${label}`, exact: true }).click();
      // Open the ordinary panel concurrently with the download, in the same session.
      const measurePanel = (async () => {
        for (let n = 0; n < 10; n++) {
          const start = performance.now();
          await monitor.goto("/users");
          await expect(
            monitor.getByRole("heading", { name: "Colaboradores", exact: true }),
          ).toBeVisible();
          samples.push(performance.now() - start);
        }
      })();
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
      await measurePanel;
    }
    const sorted = [...samples].sort((a, b) => a - b),
      p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]!;
    await writeFile(
      testInfo.outputPath("export-panel-profile.json"),
      JSON.stringify({ samples, p95, records: 100, node: process.version }),
    );
    await testInfo.attach("export-panel-profile", {
      body: JSON.stringify({
        samples,
        p95,
        records: 100,
        node: process.version,
        scope: "30 normal page openings started concurrently with the three downloads",
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
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "light";
    });
    await expectWcag22AA(page);
    await page.screenshot({
      path: testInfo.outputPath("export-light-desktop.png"),
      fullPage: true,
    });
    await page
      .getByRole("textbox", { name: "Nome", exact: true })
      .fill("Sem resultado " + crypto.randomUUID());
    const empty = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar em CSV", exact: true }).click();
    const downloaded = await empty;
    expect(readCsv(await readFile((await downloaded.path())!))).toHaveLength(1);
  } finally {
    await monitor.close();
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
    data: { ...syntheticUserContact(), name: "Colaborador parcial sintético", email, roleIds: [] },
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

test("manager grants a write they do not possess, resets a colleague password, and cannot manage their own access", async ({
  page,
}) => {
  test.setTimeout(90000);
  await login(page);
  const origin = new URL(page.url()).origin;
  const make = async (label: string) => {
    const response = await page.request.post("/api/v1/users", {
      headers: {
        origin,
        "x-csrf-token": crypto.randomUUID(),
        "idempotency-key": crypto.randomUUID(),
      },
      data: {
        ...syntheticUserContact(),
        name: label,
        email: `role-${crypto.randomUUID()}@example.test`,
        roleIds: [],
      },
    });
    expect(response.status()).toBe(201);
    return response.json();
  };
  const manager = await make("Gestor sintético exportação"),
    colleague = await make("Colaborador sem gestão");
  const sql = db();
  await sql.connect();
  await sql.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification) SELECT $1,id,$1,'Synthetic manager role' FROM role WHERE code='manager'",
    [manager.id],
  );
  const managerContext = await page.context().browser()!.newContext({ baseURL: origin }),
    colleagueContext = await page.context().browser()!.newContext({ baseURL: origin });
  const view = await managerContext.newPage();
  try {
    await login(view, manager.email, manager.initialPassword);
    await view.goto("/users");
    await expect(
      view.getByRole("link", { name: "Exportar colaboradores", exact: true }),
    ).toBeVisible();
    await expect(view.getByRole("button", { name: "Criar colaborador", exact: true })).toHaveCount(
      0,
    );
    const denied = await view.request.post("/api/v1/members", {
      headers: {
        origin,
        "x-csrf-token": crypto.randomUUID(),
        "idempotency-key": crypto.randomUUID(),
      },
      data: { ...syntheticUserContact(), name: "Write must be denied" },
    });
    expect(denied.status()).toBe(403);
    await view.goto(`/users/${colleague.id}`);
    await expect(view.getByRole("button", { name: "Conceder função", exact: true })).toHaveCount(0);
    await view
      .getByRole("checkbox", { name: "Cadastrar e editar associados", exact: true })
      .check();
    await view.getByRole("checkbox", { name: "Consultar colaboradores", exact: true }).check();
    await view.getByRole("button", { name: "Salvar acessos", exact: true }).click();
    await expect(view.getByRole("status").filter({ hasText: "Acessos atualizados" })).toBeVisible();
    await expect(view.getByRole("button", { name: "Salvar alterações", exact: true })).toHaveCount(
      0,
    );
    await view.getByRole("button", { name: "Gerar nova senha", exact: true }).click();
    await view.getByRole("button", { name: "Confirmar nova senha", exact: true }).click();
    const receipt = view.getByRole("region", { name: "Nova senha do colaborador" });
    await expect(receipt).toBeVisible();
    const password = await receipt.getByLabel("Nova senha", { exact: true }).inputValue();
    await view.goto(`/users/${manager.id}`);
    await expect(view.getByRole("button", { name: "Salvar acessos", exact: true })).toHaveCount(0);
    await expect(
      view.getByRole("checkbox", { name: "Cadastrar e editar associados", exact: true }),
    ).toBeDisabled();
    await expect(
      view.getByRole("checkbox", { name: "Cadastrar e editar associados", exact: true }),
    ).not.toBeChecked();
    const endUser = await colleagueContext.newPage();
    await login(endUser, colleague.email, password);
    await endUser.goto(`/users/${manager.id}`);
    await expect(endUser.getByRole("button", { name: "Salvar acessos", exact: true })).toHaveCount(
      0,
    );
    await expect(
      endUser.getByRole("button", { name: "Gerar nova senha", exact: true }),
    ).toHaveCount(0);
    await expect(endUser.getByRole("button", { name: "Conceder função", exact: true })).toHaveCount(
      0,
    );
  } finally {
    await managerContext.close();
    await colleagueContext.close();
    await sql.end();
  }
});

test("exports selected collaborator contact fields in Excel, CSV and PDF", async ({ page }) => {
  await login(page);
  const contact = syntheticUserContact();
  const name = `Contato exportação ${crypto.randomUUID()}`;
  const response = await page.request.post("/api/v1/users", {
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    },
    data: { ...contact, name, email: `contact-${crypto.randomUUID()}@example.test`, roleIds: [] },
  });
  expect(response.status()).toBe(201);
  await page.goto("/users/exportar");
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill(name);
  for (const label of ["CPF", "Telefone", "Endereço"])
    await page.getByRole("checkbox", { name: label, exact: true }).check();
  for (const [format, label] of [
    ["xlsx", "Excel"],
    ["csv", "CSV"],
    ["pdf", "PDF"],
  ] as const) {
    const promise = page.waitForEvent("download");
    await page.getByRole("button", { name: `Exportar em ${label}`, exact: true }).click();
    const download = await promise;
    expect(await download.failure()).toBeNull();
    const bytes = await readFile((await download.path())!);
    const content =
      format === "pdf"
        ? (await readPdf(bytes)).join(" ")
        : JSON.stringify(format === "csv" ? readCsv(bytes) : readXlsx(bytes));
    expect(content).toContain(contact.cpf);
    expect(content).toContain(contact.phone);
    expect(content).toContain(contact.address.street);
    expect(content).toContain(contact.address.postalCode);
    await expect(
      page.getByRole("status").filter({ hasText: "Geração e transferência concluídas" }),
    ).toContainText("1 registros");
  }
});
