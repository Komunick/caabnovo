import { randomUUID } from "node:crypto";
import { test, expect, syntheticUsers } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
import { keyboardActivate } from "./keyboard";
test("partner and unit creation share contact masks, CEP lookup and edit-only reasons", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.route("https://viacep.com.br/ws/40020000/json/", (route) =>
    route.fulfill({
      json: {
        cep: "40020-000",
        logradouro: "Rua sintética",
        bairro: "Centro",
        localidade: "Salvador",
        uf: "BA",
      },
    }),
  );
  await page.route("https://viacep.com.br/ws/99999999/json/", (route) =>
    route.fulfill({ json: { erro: true } }),
  );
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/partners/new");
  await expect(
    page.getByRole("navigation", { name: "Áreas de parceiros", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Voltar à lista", exact: true })).toBeVisible();
  const name = `Contatos sintéticos ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Nome do parceiro", { exact: true }).fill(name);
  await page.getByLabel("Categoria", { exact: true }).fill("Contatos");
  await expect(page.locator("#partner-reason")).toHaveCount(0);
  const cnpj = page.getByLabel("CNPJ (opcional)", { exact: true });
  await cnpj.fill("11111111111111");
  await cnpj.press("Tab");
  await expect(cnpj).toHaveAttribute("aria-invalid", "true");
  await cnpj.fill("12abc34501de35");
  await cnpj.press("Tab");
  await expect(cnpj).toHaveValue("12.ABC.345/01DE-35");
  await expect(cnpj).not.toHaveAttribute("aria-invalid", "true");
  await cnpj.fill("");
  for (const [label, invalid, valid] of [
    ["E-mail administrativo (opcional)", "email-invalido", "valid@example.test"],
    ["Site do parceiro (opcional)", "https://", "https://example.test"],
    ["Telefone administrativo (opcional)", "713", "7133334444"],
  ]) {
    const input = page.getByLabel(label!, { exact: true });
    await input.fill(invalid!);
    await input.press("Tab");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await input.fill(valid!);
    await input.press("Tab");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
  }
  await expect(page.getByLabel("Telefone administrativo (opcional)", { exact: true })).toHaveValue(
    "(71) 3333-4444",
  );
  await page.locator("#partner-postalCode").fill("40020000");
  await expect(page.locator("#partner-address")).toHaveValue("Rua sintética, Centro");
  await expect(page.locator("#partner-city")).toHaveValue("Salvador");
  await expect(page.locator("#partner-state")).toHaveValue("BA");
  await expect(page.locator("#partner-state-options option")).toHaveCount(27);
  await page.locator("#partner-state").fill("zz");
  await page.locator("#partner-state").press("Tab");
  await expect(page.locator("#partner-state")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#partner-state").fill("ba");
  await expect(page.locator("#partner-state")).toHaveValue("BA");
  await page.locator("#partner-address").fill("Rua sintética, 10, Centro");
  await expectWcag22AA(page);
  await page.getByRole("button", { name: "Criar parceiro", exact: true }).click();
  await expect(page).toHaveURL(/\/partners\/[0-9a-f-]+$/);
  const detail = page.url();
  await expect(
    page.getByRole("navigation", { name: "Áreas de parceiros", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Seções do parceiro", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#partner-address")).toHaveValue("Rua sintética, 10, Centro");
  await expect(page.locator("#partner-reason")).toBeVisible();
  await keyboardActivate(page, page.getByRole("button", { name: "Unidades", exact: true }));
  await expect(page.getByRole("button", { name: "Unidades", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Adicionar unidade", exact: true }).click();
  await page.getByLabel("Nome da unidade", { exact: true }).fill("Unidade de contato");
  await expect(page.locator("#unit-reason")).toHaveCount(0);
  await page.locator("#unit-postalCode").fill("99999999");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("CEP não encontrado");
  await page.locator("#unit-postalCode").fill("40020000");
  await expect(page.locator("#unit-city")).toHaveValue("Salvador");
  await page.locator("#unit-phone").fill("abc71999998888");
  await expect(page.locator("#unit-phone")).toHaveValue("(71) 99999-8888");
  await page.setViewportSize({ width: 390, height: 900 });
  await expectWcag22AA(page);
  await page.screenshot({
    path: testInfo.outputPath("unit-contact-light-390.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Salvar unidade", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Unidade de contato", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Editar unidade Unidade de contato", exact: true })
    .click();
  await expect(page.locator("#unit-reason")).toBeVisible();
  await page.locator("#unit-phone").fill("7133334444");
  await page.getByRole("button", { name: "Salvar unidade", exact: true }).click();
  await expect(page.locator("#unit-reason")).toBeVisible();
  await page.locator("#unit-reason").fill("Atualização sintética do telefone");
  await page.getByRole("button", { name: "Salvar unidade", exact: true }).click();
  await expect(page.locator("#unit-reason")).toHaveCount(0);
  await page.goto(`${detail}?tab=units`);
  await expect(page.getByText("Telefone: (71) 3333-4444", { exact: true })).toBeVisible();
  const data = await (await page.request.get(`/api/v1/partners/${detail.split("/").pop()}`)).json();
  expect(data.profile).toMatchObject({
    phone: "7133334444",
    postalCode: "40020000",
    address: "Rua sintética, 10, Centro",
  });
  expect(data.units[0].profile).toMatchObject({ phone: "7133334444", postalCode: "40020000" });
  await page.getByRole("link", { name: "Voltar à lista", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Áreas de parceiros", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Seções do parceiro", exact: true }),
  ).toHaveCount(0);
});
test("CEP responses preserve manual edits and an unavailable lookup does not block creation", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/partners/new");
  let release!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("https://viacep.com.br/ws/40020000/json/", async (route) => {
    await responseGate;
    await route.fulfill({
      json: {
        cep: "40020-000",
        logradouro: "Endereço automático",
        bairro: "Centro",
        localidade: "Salvador",
        uf: "BA",
      },
    });
  });
  await page.locator("#partner-postalCode").fill("40020000");
  await expect(page.getByText("Consultando CEP…", { exact: true })).toBeVisible();
  await page.locator("#partner-address").fill("Correção manual preservada");
  release();
  await expect(page.locator("#partner-city")).toHaveValue("Salvador");
  await expect(page.locator("#partner-address")).toHaveValue("Correção manual preservada");
  await page.route("https://viacep.com.br/ws/40010000/json/", (route) => route.abort("failed"));
  await page.locator("#partner-postalCode").fill("40010000");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "preencha o endereço manualmente",
  );
  await expect(page.locator("#partner-address")).toHaveValue("Correção manual preservada");
  await page
    .getByLabel("Nome do parceiro", { exact: true })
    .fill(`CEP manual ${randomUUID().slice(0, 8)}`);
  await page.getByLabel("Categoria", { exact: true }).fill("Contatos");
  await page.getByRole("button", { name: "Criar parceiro", exact: true }).click();
  await expect(page).toHaveURL(/\/partners\/[0-9a-f-]+$/);
});
