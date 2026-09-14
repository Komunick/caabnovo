import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";

const result = {
  lookupId: "11111111-1111-4111-8111-111111111111",
  number: "1234",
  state: "BA",
  source: "OAB-BA / Implanta",
  checkedAt: "2026-01-01T12:00:00.000Z",
  status: "regular",
  name: "Pessoa sintética da consulta",
  cpf: "000.000.000-00",
  delinquent: true,
  detail: "<script>texto sintético</script>",
  subsection: "Subseção sintética",
  commitmentDate: "01/02/2020",
};

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/members/oab");
});

test("shows selected OAB fields independently and accessibly without repeating the input", async ({
  page,
}, testInfo) => {
  // Intercept before submission: this fixture never calls the institution or stores a lookup.
  await page.route("**/api/v1/members/oab-query", (route) => route.fulfill({ json: result }));
  await page.getByLabel("Número da OAB", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Consultar OAB", exact: true }).click();
  const card = page.getByRole("region", { name: "Resultado da consulta" });
  await expect(card.locator("dt")).toHaveText([
    "Nome",
    "CPF",
    "Situação regular",
    "Inadimplente",
    "Detalhe",
    "Subseção",
    "Data de compromisso",
  ]);
  await expect(card.locator("dd")).toHaveText([
    result.name,
    result.cpf,
    "Sim",
    "Sim",
    result.detail,
    result.subsection,
    result.commitmentDate,
  ]);
  await expect(card).not.toContainText("1234");
  await expect(card.locator("script")).toHaveCount(0);
  await expectWcag22AA(page);
  await page.screenshot({ path: testInfo.outputPath("oab-result-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("html").evaluate((element) => {
    element.dataset.theme = "dark";
  });
  await expectWcag22AA(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: testInfo.outputPath("oab-result-mobile-dark.png"),
    fullPage: true,
  });
  await page.getByLabel("Número da OAB", { exact: true }).fill("4321");
  await expect(card).toHaveCount(0);
});

test("distinguishes unknown fields, no record and failure without stale personal information", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/v1/members/oab-query", (route) => {
    calls++;
    if (calls === 3) return route.fulfill({ status: 503, json: { code: "OAB_UNAVAILABLE" } });
    return route.fulfill({
      json: {
        ...result,
        status: calls === 1 ? "unknown" : "not_found",
        name: calls === 1 ? result.name : null,
        cpf: null,
        delinquent: null,
        detail: null,
        subsection: null,
        commitmentDate: null,
      },
    });
  });
  await page.getByLabel("Número da OAB", { exact: true }).fill("1234");
  const query = page.getByRole("button", { name: "Consultar OAB", exact: true });
  await query.click();
  const card = page.getByRole("region", { name: "Resultado da consulta" });
  await expect(card.locator("dd")).toHaveText([
    result.name,
    "Não informado",
    "Não informada",
    "Não informado",
    "Não informado",
    "Não informada",
    "Não informada",
  ]);
  await query.click();
  await expect(card).toContainText("Inscrição não encontrada");
  await expect(card.locator("dl")).toHaveCount(0);
  await query.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "O serviço da OAB-BA está indisponível" }),
  ).toBeVisible();
  await expect(card).toHaveCount(0);
});
