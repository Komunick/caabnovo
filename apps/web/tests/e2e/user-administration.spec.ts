import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { expectWcag22AA } from "./accessibility";
import { expect, syntheticUsers, test } from "./fixtures";

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("administrator creates, updates, grants, revokes and disables a user", async ({
  page,
}, testInfo) => {
  const suffix = randomUUID().slice(0, 8);
  const name = `Usuário Gerenciado ${suffix}`;
  const updatedName = `${name} Atualizado`;
  const email = `managed-${testInfo.project.name}-${suffix}@example.test`;
  await signIn(page, syntheticUsers.accessManager.email, syntheticUsers.accessManager.password);
  await page
    .getByRole("navigation", { name: "Navegação administrativa" })
    .getByRole("link", { name: "Colaboradores", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible();
  await expectWcag22AA(page);

  const createButton = page.getByRole("button", { name: "Criar colaborador" });
  await expect(createButton).toBeEnabled();
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await expect(page.getByLabel("Justificativa", { exact: true })).toHaveCount(0);
  await createButton.click();
  const receipt = page.getByRole("region", { name: "Senha inicial do colaborador" });
  await expect(receipt).toBeVisible();
  const initialPassword = await receipt.getByLabel("Senha inicial", { exact: true }).inputValue();
  expect(/^[A-Z][a-z]{5,}\d{6}$/.test(initialPassword)).toBe(true);
  await expect(receipt.getByLabel("Senha inicial", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await receipt.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(receipt.getByLabel("Senha inicial", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await receipt.getByRole("button", { name: "Ocultar senha" }).click();
  await expectWcag22AA(page);
  await page.screenshot({
    path: testInfo.outputPath("initial-password-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expectWcag22AA(page);
  await page.screenshot({
    path: testInfo.outputPath("initial-password-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  const colleague = await page
    .context()
    .browser()!
    .newContext({ baseURL: new URL(page.url()).origin });
  try {
    const colleaguePage = await colleague.newPage();
    await signIn(colleaguePage, email, initialPassword);
  } finally {
    await colleague.close();
  }
  await receipt.getByRole("link", { name: "Abrir colaborador" }).click();
  await expect(page).toHaveURL(/\/users\/[0-9a-f-]+$/);
  await expect(page.getByLabel("Senha inicial", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Gerar senha inicial" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name })).toBeVisible();

  const saveButton = page.getByRole("button", { name: "Salvar alterações" });
  await expect(saveButton).toBeEnabled();
  await expectWcag22AA(page);
  await page.getByLabel("Nome").fill(updatedName);
  await expect(page.getByLabel("Justificativa", { exact: true })).toHaveCount(0);
  await saveButton.click();
  await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();

  const grantButton = page.getByRole("button", { name: "Conceder função" });
  await expect(grantButton).toBeEnabled();
  await page.getByLabel("Função", { exact: true }).selectOption({ label: "Consulta de usuários" });
  await expect(page.getByLabel("Justificativa da função")).toHaveCount(0);
  await grantButton.click();
  await expect(page.getByText("Consulta de usuários", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Revogar Consulta de usuários" }).click();
  await expect(page.getByLabel("Motivo da revogação")).toHaveCount(0);
  await page.getByRole("button", { name: "Confirmar revogação" }).click();
  await expect(page.getByRole("button", { name: "Revogar Consulta de usuários" })).toHaveCount(0);

  const accesses = page.getByRole("region", { name: "Acessos do colaborador" });
  await accesses.getByRole("checkbox", { name: "Consultar notícias e rascunhos" }).check();
  await accesses.getByRole("checkbox", { name: "Criar e editar notícias", exact: true }).check();
  await accesses.getByRole("checkbox", { name: "Publicar, programar e arquivar notícias" }).check();
  await accesses.getByRole("checkbox", { name: "Criar e editar notícias", exact: true }).uncheck();
  await expect(
    accesses.getByRole("checkbox", { name: "Publicar, programar e arquivar notícias" }),
  ).not.toBeChecked();
  await expect(accesses.getByLabel("Justificativa dos acessos")).toHaveCount(0);
  await accesses.getByRole("button", { name: "Salvar acessos" }).click();
  await expect(accesses.getByRole("status")).toHaveText("Acessos atualizados.");
  await page.reload();
  await expect(
    accesses.getByRole("checkbox", { name: "Consultar notícias e rascunhos" }),
  ).toBeChecked();
  await expect(
    accesses.getByRole("checkbox", { name: "Criar e editar notícias", exact: true }),
  ).not.toBeChecked();
  await expectWcag22AA(page);

  await page.getByRole("button", { name: "Desativar colaborador" }).click();
  await expect(page.getByLabel("Justificativa da desativação")).toHaveCount(0);
  await page.getByRole("button", { name: "Confirmar desativação" }).click();
  await expect(page.getByText("Desativado", { exact: true })).toBeVisible();
});

test("ordinary user cannot open user administration", async ({ page }) => {
  await signIn(page, syntheticUsers.ordinary.email, syntheticUsers.ordinary.password);
  await expect(page.getByRole("link", { name: "Colaboradores", exact: true })).toHaveCount(0);
  await page.goto("/users");
  await expect(page.getByText("Você não tem permissão para acessar colaboradores.")).toBeVisible();
});

test("administrator initializes a legacy account without replacing existing credentials", async ({
  page,
}) => {
  const database = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await database.connect();
  const email = `legacy-password-${randomUUID()}@example.test`;
  let userId: string;
  try {
    userId = (
      await database.query('INSERT INTO "user"(name,email) VALUES ($1,$2) RETURNING id', [
        "Colaborador sem senha",
        email,
      ])
    ).rows[0].id;
  } finally {
    await database.end();
  }
  await signIn(page, syntheticUsers.accessManager.email, syntheticUsers.accessManager.password);
  await page.goto(`/users/${userId}`);
  await page.getByRole("button", { name: "Gerar senha inicial" }).click();
  const field = page.getByLabel("Senha inicial", { exact: true });
  await expect(field).toBeVisible();
  const password = await field.inputValue();
  expect(/^[A-Z][a-z]{5,}\d{6}$/.test(password)).toBe(true);
  const duplicate = await page.request.post(`/api/v1/users/${userId}/initial-password`, {
    headers: { origin: new URL(page.url()).origin, "x-csrf-token": randomUUID() },
  });
  expect(duplicate.status()).toBe(409);
  await expectWcag22AA(page);
  await page.getByRole("link", { name: "Abrir colaborador" }).click();
  await expect(field).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "Gerar senha inicial" })).toHaveCount(0);
  const colleague = await page
    .context()
    .browser()!
    .newContext({ baseURL: new URL(page.url()).origin });
  try {
    await signIn(await colleague.newPage(), email, password);
  } finally {
    await colleague.close();
  }
});

test("manager can reach accounts beyond the first hundred and recover from invalid cursors", async ({
  page,
}) => {
  const database = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await database.connect();
  const suffix = randomUUID();
  let insertedIds: string[] = [];
  try {
    const inserted = await database.query<{ id: string }>(
      `INSERT INTO "user" (name, email)
       SELECT 'Pagination fixture', 'pagination-' || $1 || '-' || n || '@example.test'
       FROM generate_series(1, 101) AS n RETURNING id`,
      [suffix],
    );
    insertedIds = inserted.rows.map(({ id }) => id);
    await signIn(page, syntheticUsers.accessManager.email, syntheticUsers.accessManager.password);
    await page.goto("/users");
    const accounts = page.getByRole("table", { name: "Contas cadastradas" });
    const links = accounts.getByRole("link");
    await expect(links).toHaveCount(100);
    const firstPageNames = await links.allTextContents();
    const firstPageHrefs = await links.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")),
    );
    await page.getByRole("link", { name: "Próxima", exact: true }).click();
    await expect(page).toHaveURL(/\/users\?cursor=/);
    await expect(links.first()).toBeVisible();
    const secondPageHrefs = await links.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")),
    );
    expect(secondPageHrefs.some((href) => firstPageHrefs.includes(href))).toBe(false);
    await page.getByRole("link", { name: "Primeira página" }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(links).toHaveText(firstPageNames);

    for (const query of ["cursor=invalid", "cursor=invalid&cursor=also-invalid"]) {
      await page.goto(`/users?${query}`);
      await expect(
        page.getByRole("region", { name: "Contas cadastradas" }).getByRole("alert"),
      ).toHaveText("A página solicitada é inválida. Exibindo a primeira página.");
      await expect(links).toHaveText(firstPageNames);
    }
  } finally {
    await database.query('DELETE FROM "user" WHERE id = ANY($1::uuid[])', [insertedIds]);
    await database.end();
  }
});
