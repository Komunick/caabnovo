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
  await page.getByRole("button", { name: "Novo serviço", exact: true }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Serviço ainda em edição");
  await page.getByRole("combobox", { name: "Unidade", exact: true }).fill("Consulta incompleta");
  await page
    .getByRole("navigation", { name: "Agendamentos", exact: true })
    .getByRole("link", { name: "Unidades", exact: true })
    .click();
  await page.getByRole("button", { name: "Nova unidade", exact: true }).click();
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
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("button", { name: "Novo serviço", exact: true }).click();
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
  await page.screenshot({
    path: info.outputPath("workspace-drafts-news-restored.png"),
    fullPage: true,
  });
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
    page.getByRole("alert").filter({ hasText: /alterado|versão|atualiz/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome social (opcional)")).toHaveValue("Nome social pendente");
  await page.getByRole("button", { name: "Documentos", exact: true }).click();
  await expect(page.getByLabel("Categoria do documento")).toHaveValue("Comprovante pendente");
});
