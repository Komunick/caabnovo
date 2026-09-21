import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}
async function area(page: Page, path: string) {
  await page.locator(`a[href="${path}"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
}
async function create(page: Page, path: string) {
  await area(page, path);
  await page.locator(`a[href="${path}/new"]`).first().click();
  await expect(page).toHaveURL(new RegExp(`${path}/new$`));
}
async function capture(page: Page, path: string) {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
}
test("keeps unfinished forms through all workspace modules and clears completed creations", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await signIn(page);
  await create(page, "/members");
  await page.getByLabel("Nome completo").fill("Pessoa ainda em edição");
  await page.getByLabel("Nascimento (opcional)").fill("1990-02-13");
  await create(page, "/partners");
  await page.getByLabel("Nome do parceiro", { exact: true }).fill("Parceiro ainda em edição");
  await page.locator("#partner-city").fill("Salvador");
  await page.locator("#partner-state").fill("BA");
  await create(page, "/news");
  const title = `Notícia em edição ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Resumo", { exact: true }).fill("Resumo ainda não salvo");
  await page.locator("#news-body").fill("Conteúdo ainda não salvo");
  await area(page, "/users");
  await page.locator("#create-name").fill("Colaborador em edição");
  await page.locator("#create-email").fill("pendente@example.test");
  await area(page, "/scheduling");
  await page
    .getByRole("navigation", { name: "Agendamentos", exact: true })
    .getByRole("link", { name: "Serviços", exact: true })
    .click();
  await page
    .locator(".page-header")
    .getByRole("button", { name: "Novo serviço", exact: true })
    .click();
  await page.getByLabel("Nome", { exact: true }).fill("Serviço ainda em edição");
  await page.getByRole("combobox", { name: "Unidade", exact: true }).fill("Consulta incompleta");
  await page
    .getByRole("navigation", { name: "Agendamentos", exact: true })
    .getByRole("link", { name: "Unidades", exact: true })
    .click();
  await page
    .locator(".page-header")
    .getByRole("button", { name: "Nova unidade", exact: true })
    .click();
  await page.getByLabel("Nome", { exact: true }).fill("Unidade ainda em edição");
  await area(page, "/audit");
  await page.getByLabel("Pessoa", { exact: true }).fill("Pessoa consultada");
  await create(page, "/members");
  await expect(page.getByLabel("Nome completo")).toHaveValue("Pessoa ainda em edição");
  await expect(page.getByLabel("Nascimento (opcional)")).toHaveValue("1990-02-13");
  await create(page, "/partners");
  await expect(page.getByLabel("Nome do parceiro", { exact: true })).toHaveValue(
    "Parceiro ainda em edição",
  );
  await expect(page.locator("#partner-city")).toHaveValue("Salvador");
  await expect(page.locator("#partner-state")).toHaveValue("BA");
  await area(page, "/users");
  await expect(page.locator("#create-name")).toHaveValue("Colaborador em edição");
  await expect(page.locator("#create-email")).toHaveValue("pendente@example.test");
  await area(page, "/scheduling");
  const tabs = page.getByRole("navigation", { name: "Agendamentos", exact: true });
  await tabs.getByRole("link", { name: "Serviços", exact: true }).click();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Serviço ainda em edição");
  await expect(page.getByRole("combobox", { name: "Unidade", exact: true })).toHaveValue(
    "Consulta incompleta",
  );
  expect(
    await page
      .getByRole("combobox", { name: "Unidade", exact: true })
      .evaluate((el) => (el as HTMLInputElement).validity.valid),
  ).toBe(false);
  await page.getByRole("button", { name: "Voltar para serviços", exact: true }).click();
  await page
    .locator(".page-header")
    .getByRole("button", { name: "Novo serviço", exact: true })
    .click();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Serviço ainda em edição");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .locator(".page-header")
    .getByRole("button", { name: "Novo serviço", exact: true })
    .click();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("");
  await expect(page.getByRole("combobox", { name: "Unidade", exact: true })).toHaveValue("");
  await tabs.getByRole("link", { name: "Unidades", exact: true }).click();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("Unidade ainda em edição");
  await area(page, "/audit");
  await expect(page.getByLabel("Pessoa", { exact: true })).toHaveValue("Pessoa consultada");
  await create(page, "/news");
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(title);
  await expect(page.getByLabel("Resumo", { exact: true })).toHaveValue("Resumo ainda não salvo");
  await expect(page.locator("#news-body")).toContainText("Conteúdo ainda não salvo");
  await expectWcag22AA(page);
  await capture(page, info.outputPath("workspace-drafts-news-restored.png"));
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/);
  await create(page, "/news");
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("");
  await expect(page.locator("#news-body")).not.toContainText("Conteúdo ainda não salvo");
});

test("preserves member edits across inner tabs, other records and failed saves without replacing the original revision", async ({
  page,
}) => {
  test.setTimeout(120000);
  await signIn(page);
  const suffix = randomUUID().slice(0, 8);
  const headers = {
    origin: new URL(page.url()).origin,
    "x-csrf-token": randomUUID(),
    "idempotency-key": randomUUID(),
  };
  const response = await page.request.post("/api/v1/members", {
    headers,
    data: { profile: { name: `Pessoa navegação ${suffix}` } },
  });
  expect(response.ok()).toBe(true);
  const record = await response.json();
  await page.goto(`/members/${record.id}`);
  await page.getByRole("button", { name: "Cadastro", exact: true }).click();
  await page.getByLabel("Nome social (opcional)").fill("Nome social pendente");
  await page.getByRole("button", { name: "Documentos", exact: true }).click();
  await page.getByLabel("Categoria do documento").fill("Comprovante pendente");
  await page.getByRole("button", { name: "Cadastro", exact: true }).click();
  await expect(page.getByLabel("Nome social (opcional)")).toHaveValue("Nome social pendente");
  await area(page, "/partners");
  await page.goBack();
  await expect(page.getByLabel("Nome social (opcional)")).toHaveValue("Nome social pendente");
  const updated = await page.request.post(`/api/v1/members/${record.id}/commands`, {
    headers: { ...headers, "idempotency-key": randomUUID() },
    data: {
      action: "update",
      expectedVersion: record.version,
      profile: { ...record.profile, name: `Outra revisão ${suffix}` },
    },
  });
  expect(updated.ok()).toBe(true);
  await area(page, "/partners");
  await page.goBack();
  await page.getByRole("button", { name: "Salvar cadastro", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /cadastro mudou em outra operação/i }),
  ).toBeVisible();
  await area(page, "/partners");
  await page.goBack();
  await expect(
    page.getByRole("alert").filter({ hasText: /cadastro mudou em outra operação/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome social (opcional)")).toHaveValue("Nome social pendente");
  await page.getByRole("button", { name: "Documentos", exact: true }).click();
  await expect(page.getByLabel("Categoria do documento")).toHaveValue("Comprovante pendente");
});

test("news conflicts survive navigation with field errors and the original revision", async ({
  page,
}) => {
  await signIn(page);
  await create(page, "/news");
  await page.getByLabel("Título", { exact: true }).fill(`Rascunho ${randomUUID()}`);
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]+$/);
  const path = new URL(page.url()).pathname;
  const record = await (await page.request.get(`/api/v1${path}`)).json();
  const sentVersions: number[] = [];
  await page.route(`**/api/v1${path}`, async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    sentVersions.push(route.request().postDataJSON().expectedVersion);
    await route.fulfill({
      status: 409,
      json: { code: "NEWS_VERSION_CONFLICT", fields: [{ path: "title" }] },
    });
  });
  await page.getByLabel("Título", { exact: true }).fill("Texto ainda não salvo");
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  const conflict = page.getByRole("alert").filter({ hasText: "Outra alteração foi salva" });
  await expect(conflict).toBeVisible();
  await area(page, "/members");
  await page.goBack();
  await expect(conflict).toBeVisible();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Texto ainda não salvo");
  await expect(page.getByLabel("Título", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect.poll(() => sentVersions).toEqual([record.revision, record.revision]);
  await page.unroute(`**/api/v1${path}`);
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect(conflict).toHaveCount(0);
  await area(page, "/members");
  await page.goBack();
  await expect(conflict).toHaveCount(0);
});

test("access conflicts preserve selection and baseline without leaking to another user", async ({
  page,
}) => {
  await signIn(page);
  const users = [];
  for (let index = 0; index < 2; index++) {
    const response = await page.request.post("/api/v1/users", {
      headers: {
        origin: new URL(page.url()).origin,
        "x-csrf-token": randomUUID(),
        "idempotency-key": randomUUID(),
      },
      data: {
        name: `Rascunho acesso ${index}`,
        email: `draft-${randomUUID()}@example.test`,
        roleIds: [],
      },
    });
    expect(response.ok()).toBe(true);
    users.push(await response.json());
  }
  await page.goto(`/users/${users[0].id}`);
  const submitted: unknown[] = [];
  await page.route(`**/api/v1/users/${users[0].id}/access`, async (route) => {
    if (route.request().method() !== "PUT") return route.continue();
    submitted.push(route.request().postDataJSON());
    await route.fulfill({ status: 409, json: { code: "ACCESS_VERSION_CONFLICT" } });
  });
  const checkbox = page.getByRole("checkbox", { name: "Consultar associados", exact: true });
  await checkbox.check();
  await page.getByRole("button", { name: "Salvar acessos", exact: true }).click();
  const conflict = page.getByRole("alert").filter({ hasText: "Os acessos mudaram" });
  await expect(conflict).toBeVisible();
  await area(page, "/users");
  await page.locator(`a[href="/users/${users[1].id}"]`).first().click();
  await expect(conflict).toHaveCount(0);
  await expect(checkbox).not.toBeChecked();
  await page.goBack();
  await page.goBack();
  await expect(conflict).toBeVisible();
  await expect(checkbox).toBeChecked();
  await page.getByRole("button", { name: "Salvar acessos", exact: true }).click();
  await expect.poll(() => submitted.length).toBe(2);
  expect(submitted[1]).toEqual(submitted[0]);
});

test("partner sections keep independent edits when another form is saved or cancelled", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await signIn(page);
  const response = await page.request.post("/api/v1/partners", {
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": randomUUID(),
      "idempotency-key": randomUUID(),
    },
    data: {
      profile: { name: `Parceiro navegação ${randomUUID().slice(0, 8)}`, category: "Bem-estar" },
    },
  });
  expect(response.ok()).toBe(true);
  const record = await response.json();
  await page.goto(`/partners/${record.id}`);
  await page.getByLabel("Pessoa de contato (opcional)").fill("Contato pendente");
  await page.getByRole("button", { name: "Unidades", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar unidade", exact: true }).click();
  await page.getByLabel("Nome da unidade", { exact: true }).fill("Unidade pendente");
  await page.locator("#unit-city").fill("Salvador");
  await page.getByRole("button", { name: "Contratos", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar contrato", exact: true }).click();
  await page.getByLabel("Referência do contrato").fill("Contrato pendente");
  await page.getByRole("button", { name: "Benefícios", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar benefício", exact: true }).click();
  await page.getByLabel("Título", { exact: true }).fill("Benefício pendente");
  await area(page, "/members");
  await page.goBack();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Benefício pendente");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar benefício", exact: true }).click();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Unidades", exact: true }).click();
  await expect(page.getByLabel("Nome da unidade", { exact: true })).toHaveValue("Unidade pendente");
  await expect(page.locator("#unit-city")).toHaveValue("Salvador");
  await page.getByRole("button", { name: "Salvar unidade", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Unidade pendente", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cadastro", exact: true }).click();
  await expect(page.getByLabel("Pessoa de contato (opcional)")).toHaveValue("Contato pendente");
  await page.getByRole("button", { name: "Contratos", exact: true }).click();
  await expect(page.getByLabel("Referência do contrato")).toHaveValue("Contrato pendente");
  await capture(page, info.outputPath("workspace-drafts-partner-restored.png"));
});

test("account forms survive module navigation and logout ends the editing session", async ({
  page,
}) => {
  test.setTimeout(90000);
  await signIn(page);
  async function settings() {
    await page.getByRole("button", { name: /^Menu da conta de/ }).click();
    await page.getByRole("link", { name: "Configurações da conta", exact: true }).click();
    await expect(page).toHaveURL(/\/settings$/);
  }
  await settings();
  await page.locator("#settings-name").fill("Nome em edição");
  await page.locator('input[name="newEmail"]').fill("email-pendente@example.test");
  const passwords = page.locator('input[name="currentPassword"]');
  await passwords.nth(0).fill("Senha pendente email");
  await passwords.nth(1).fill("Senha pendente troca");
  await area(page, "/members");
  await settings();
  await expect(page.locator("#settings-name")).toHaveValue("Nome em edição");
  await expect(page.locator('input[name="newEmail"]')).toHaveValue("email-pendente@example.test");
  await expect(passwords.nth(0)).toHaveValue("Senha pendente email");
  await expect(passwords.nth(1)).toHaveValue("Senha pendente troca");
  await page.getByRole("button", { name: /^Menu da conta de/ }).click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page);
  await settings();
  await expect(page.locator("#settings-name")).not.toHaveValue("Nome em edição");
  await expect(page.locator('input[name="newEmail"]')).toHaveValue("");
  await expect(passwords.nth(0)).toHaveValue("");
  await expect(passwords.nth(1)).toHaveValue("");
});
