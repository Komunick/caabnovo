import { expectExportAboveFilters } from "./panel-actions";
import { syntheticUserContact } from "../helpers/user-contact";
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

  await page.getByRole("link", { name: "Novo colaborador", exact: true }).click();
  const createButton = page.getByRole("button", { name: "Criar colaborador" });
  await expect(createButton).toBeEnabled();
  const administrator = page.getByRole("radio", { name: "Administrador", exact: true });
  const manager = page.getByRole("radio", { name: "Gestor", exact: true });
  const collaborator = page.getByRole("radio", { name: "Colaborador", exact: true });
  await administrator.check();
  await manager.check();
  await expect(administrator).not.toBeChecked();
  await collaborator.check();
  await expect(manager).not.toBeChecked();
  await expect(page.locator('input[name="roleIds"]:checked')).toHaveCount(1);
  await expect(collaborator).toHaveAccessibleDescription(
    /Utiliza apenas os módulos e ações concedidos/,
  );
  await expect(administrator).toHaveAccessibleDescription(/Acesso completo ao painel/);
  await expect(manager).toHaveAccessibleDescription(/Não concede cargos/);
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("E-mail").fill(email);
  await createButton.click();
  await expect(page.getByLabel("CPF", { exact: true })).toHaveAttribute("required", "");
  await expect(page.getByRole("region", { name: "Senha inicial do colaborador" })).toHaveCount(0);
  const contact = syntheticUserContact();
  await page.route("https://viacep.com.br/**", (route) => route.abort());
  await page.getByLabel("CPF", { exact: true }).fill(contact.cpf);
  await page.getByLabel("Telefone", { exact: true }).fill(contact.phone);
  await page.getByLabel("CEP (opcional)", { exact: true }).fill(contact.address.postalCode);
  await page.getByLabel("Rua", { exact: true }).fill(contact.address.street);
  await page.getByLabel("Número", { exact: true }).fill(contact.address.number);
  await page.getByLabel("Bairro", { exact: true }).fill(contact.address.neighborhood);
  await page.getByLabel("Cidade", { exact: true }).fill(contact.address.city);
  await page.getByLabel("Estado (UF)", { exact: true }).fill(contact.address.state);
  await page
    .getByRole("navigation", { name: "Navegação administrativa" })
    .getByRole("link", { name: "Início", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Navegação administrativa" })
    .getByRole("link", { name: "Colaboradores", exact: true })
    .click();
  await page.getByRole("link", { name: "Novo colaborador", exact: true }).click();
  await expect(page.getByLabel("Rua", { exact: true })).toHaveValue(contact.address.street);
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue(name);
  await expect(collaborator).toBeChecked();
  await expect(page.locator('input[name="roleIds"]:checked')).toHaveCount(1);
  await page.screenshot({
    path: testInfo.outputPath("collaborator-fields-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expectWcag22AA(page);
  await page.screenshot({
    path: testInfo.outputPath("collaborator-fields-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 720 });
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

  await expect(page.getByLabel("CPF", { exact: true })).toHaveValue(
    contact.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
  );
  await expect(page.getByLabel("Rua", { exact: true })).toHaveValue(contact.address.street);
  const saveButton = page.getByRole("button", { name: "Salvar alterações" });
  await expect(saveButton).toBeEnabled();
  await expectWcag22AA(page);
  await page.getByLabel("Nome").fill(updatedName);
  await page.getByLabel("Número", { exact: true }).fill("42");
  await expect(page.getByLabel("Justificativa", { exact: true })).toHaveCount(0);
  await saveButton.click();
  await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Número", { exact: true })).toHaveValue("42");

  await expect(page.getByRole("button", { name: "Conceder função" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Revogar Colaborador", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Utiliza apenas os módulos e ações concedidos. Não administra cargos nem acessos de outras pessoas.",
    ),
  ).toBeVisible();
  await expectWcag22AA(page);
  await page.screenshot({
    path: testInfo.outputPath("collaborator-role-assigned.png"),
    fullPage: true,
    animations: "disabled",
  });
  const roleList = await page.request.get("/api/v1/roles");
  const roles = await roleList.json();
  const otherRole = roles.find((role: { code: string }) => role.code === "manager");
  const conflicting = await page.request.put(
    `/api/v1/users/${page.url().split("/").pop()}/roles/${otherRole.id}`,
    {
      headers: { origin: new URL(page.url()).origin, "x-csrf-token": randomUUID() },
      data: {},
    },
  );
  expect(conflicting.status()).toBe(409);
  expect(await conflicting.json()).toMatchObject({ code: "USER_ROLE_CONFLICT" });
  await page.getByRole("button", { name: "Revogar Colaborador", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar revogação" }).click();
  const grantButton = page.getByRole("button", { name: "Conceder função" });
  await expect(grantButton).toBeEnabled();
  await page.getByRole("radio", { name: "Consulta de usuários", exact: true }).check();
  await expect(page.getByLabel("Justificativa da função")).toHaveCount(0);
  await grantButton.click();
  await expect(page.getByText("Consulta de usuários", { exact: true })).toBeVisible();
  await expect(grantButton).toHaveCount(0);
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

test("collaborator list uses compact shared actions and collapsible filters", async ({
  page,
}, info) => {
  await signIn(page, syntheticUsers.administrator.email, syntheticUsers.administrator.password);
  const contact = syntheticUserContact();
  const name = `Lista compacta ${randomUUID()}`;
  const response = await page.request.post("/api/v1/users", {
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": randomUUID(),
      "idempotency-key": randomUUID(),
    },
    data: { ...contact, name, email: `list-${randomUUID()}@example.test`, roleIds: [] },
  });
  expect(response.status()).toBe(201);
  await page.goto("/users");
  await expect(page.getByLabel("CPF", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Novo colaborador", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Exportar colaboradores", exact: true })).toHaveClass(
    /button--secondary/,
  );
  const filters = page.getByRole("search", { name: "Filtros de colaboradores" });
  const search = filters.getByRole("searchbox", { name: "Nome, CPF ou e-mail" });
  await expect(filters.getByLabel("Situação", { exact: true })).toBeHidden();
  await search.fill(name);
  await filters.getByRole("button", { name: "Buscar", exact: true }).click();
  const table = page.getByRole("table", { name: "Contas cadastradas" });
  await expect(table.getByRole("link")).toHaveText([name]);
  await filters.getByRole("button", { name: "Filtros", exact: true }).click();
  await filters.getByLabel("Função atribuída", { exact: true }).selectOption("none");
  await expect(table.getByRole("link")).toHaveText([name]);
  await filters.getByLabel("Cadastrado de", { exact: true }).fill("2000-01-01");
  await filters.getByLabel("Cadastrado até", { exact: true }).fill("2000-12-31");
  await filters.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(
    page.getByText("Nenhuma conta encontrada nesta página.", { exact: true }),
  ).toBeVisible();
  await filters.getByRole("button", { name: "Limpar filtros", exact: true }).click();
  await search.fill(contact.cpf);
  await filters.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(table.getByRole("link")).toHaveText([name]);
  await filters.getByLabel("Situação", { exact: true }).selectOption("disabled");
  await expect(
    page.getByText("Nenhuma conta encontrada nesta página.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Novo colaborador", exact: true })).toBeVisible();
  await filters.getByRole("button", { name: "Limpar filtros", exact: true }).click();
  await search.fill(contact.cpf);
  await filters.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(table.getByRole("link")).toHaveText([name]);
  for (const [width, height] of [
    [1280, 900],
    [390, 844],
  ]) {
    await page.setViewportSize({ width: width!, height: height! });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width!,
    );
    if (width === 390) {
      const scroll = page.getByLabel(
        "Tabela de contas; use as setas para percorrer horizontalmente",
      );
      expect(await scroll.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    }
    const panel = page.getByRole("region", { name: "Contas cadastradas", exact: true });
    await expectExportAboveFilters(
      panel,
      panel.getByRole("link", { name: "Exportar colaboradores", exact: true }),
      filters,
    );
    await expect(
      page.locator(".page-header").getByRole("link", { name: "Novo colaborador", exact: true }),
    ).toHaveClass(/button--primary.*button--add/);
    for (const theme of ["light", "dark"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("caab-theme", theme);
      }, theme);
      await expectWcag22AA(page);
      await page.screenshot({
        path: info.outputPath(`collaborator-list-${theme}-${width}.png`),
        fullPage: true,
      });
    }
  }
});
