import { randomUUID } from "node:crypto";
import { Client } from "pg";
import type { Page } from "@playwright/test";
import type { PartnerRecord } from "@caab/contracts";
import { test, expect, syntheticUsers } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
import { keyboardActivate, keyboardType } from "./keyboard";

async function signIn(page: Page, administrator = true) {
  const user = administrator ? syntheticUsers.administrator : syntheticUsers.ordinary;
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30000 });
}
async function post(page: Page, path: string, data: unknown) {
  const response = await page.request.post(path, {
    data,
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": randomUUID(),
      "idempotency-key": randomUUID(),
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}
test("directory screens preserve edits and apply app settings, unit links and review moderation", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  await signIn(page);
  const category = `Categoria sintética ${randomUUID().slice(0, 8)}`;
  await page.goto("/partners/categories");
  await keyboardActivate(page, page.getByRole("button", { name: "Nova categoria", exact: true }));
  await keyboardType(page, page.getByLabel("Nome da categoria", { exact: true }), category);
  await page.getByLabel("Justificativa da categoria").fill("Organização sintética");
  await page.route("**/api/v1/partners/categories", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 503, json: { code: "UNAVAILABLE" } })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Salvar categoria", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("503");
  await expect(page.getByLabel("Nome da categoria", { exact: true })).toHaveValue(category);
  await page.unroute("**/api/v1/partners/categories");
  await page.getByRole("button", { name: "Salvar categoria", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Categoria salva." })).toBeVisible();
  let partner: PartnerRecord = await post(page, "/api/v1/partners", {
    profile: { name: category, category },
    justification: "Parceiro sintético",
  });
  const command = async (data: unknown) => {
    partner = await post(page, `/api/v1/partners/${partner.id}/commands`, {
      ...(data as object),
      expectedVersion: partner.version,
      justification: "Operação sintética",
    });
  };
  await command({
    action: "unit",
    profile: { name: `Unidade ${category}`, mode: "presential", city: "Salvador", state: "BA" },
    active: true,
  });
  await command({
    action: "contract",
    contract: {
      reference: "Contrato sintético",
      terms: "Condições sintéticas",
      startsOn: "2020-01-01",
      endsOn: "2099-12-31",
    },
  });
  await command({
    action: "contract-status",
    contractId: partner.contracts[0]!.id,
    status: "approved",
  });
  await command({
    action: "benefit",
    draft: {
      title: category,
      description: "Oferta sintética",
      conditions: "Condições sintéticas",
      audience: "Público sintético",
      unitId: partner.units[0]!.id,
      contractId: partner.contracts[0]!.id,
      startsOn: "2020-01-01",
      endsOn: "2099-12-31",
      channels: ["app", "site"],
    },
  });
  await command({ action: "publish", benefitId: partner.benefits[0]!.id });
  await page.reload();
  await page.getByRole("button", { name: `Editar categoria ${category}`, exact: true }).click();
  const renamed = `${category} nova`;
  await page.getByLabel("Nome da categoria", { exact: true }).fill(renamed);
  await page.getByLabel("Justificativa da categoria").fill("Renomear preservando vínculos");
  await page.getByRole("button", { name: "Salvar categoria", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: renamed })).toContainText("1");
  await page.goto("/partners/units");
  await page.getByLabel("Unidade, parceiro ou localidade").fill(category);
  await page.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await keyboardActivate(
    page,
    page.getByRole("link", { name: `Unidade ${category}`, exact: true }),
  );
  await expect(page).toHaveURL(new RegExp(`/partners/${partner.id}\\?tab=units#unit-`));
  await expect(
    page.getByRole("heading", { name: `Unidade ${category}`, exact: true }),
  ).toBeVisible();
  await page.goto("/partners/settings");
  await page.getByLabel("Escolher categorias", { exact: true }).check();
  await page.getByRole("button", { name: "Desmarcar todas", exact: true }).click();
  await page.getByLabel("Justificativa da configuração").fill("Seleção vazia de teste");
  await page.getByRole("button", { name: "Salvar configuração do app", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Configuração do app salva." }),
  ).toBeVisible();
  expect(
    (
      await (
        await page.request.get(`/api/v1/benefits/app?category=${encodeURIComponent(renamed)}`)
      ).json()
    ).items,
  ).toEqual([]);
  expect((await (await page.request.get("/api/v1/benefits/app/categories")).json()).items).toEqual(
    [],
  );
  expect(
    (
      await (
        await page.request.get(`/api/v1/benefits/site?category=${encodeURIComponent(renamed)}`)
      ).json()
    ).items,
  ).toHaveLength(1);
  await page.reload();
  await expect(page.getByLabel("Escolher categorias", { exact: true })).toBeChecked();
  await expect(page.getByLabel(renamed, { exact: true })).not.toBeChecked();
  // Another operator changes the saved version while this form remains open.
  const current = await (await page.request.get("/api/v1/partners/settings")).json();
  await post(page, "/api/v1/partners/settings", {
    expectedVersion: current.settings.version,
    mode: "all",
    categoryIds: [],
    justification: "Alteração concorrente sintética",
  });
  await page.getByLabel(renamed, { exact: true }).check();
  await page.getByLabel("Justificativa da configuração").fill("Seleção preservada após conflito");
  await page.getByRole("button", { name: "Salvar configuração do app", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Outra pessoa");
  await page.getByRole("button", { name: "Atualizar versão da configuração" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Sua seleção foi mantida");
  await expect(page.getByLabel(renamed, { exact: true })).toBeChecked();
  await expect(page.getByLabel("Justificativa da configuração")).toHaveValue(
    "Seleção preservada após conflito",
  );
  await page.getByRole("button", { name: "Salvar configuração do app", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Configuração do app salva." }),
  ).toBeVisible();
  expect(
    (
      await (
        await page.request.get(`/api/v1/benefits/app?category=${encodeURIComponent(renamed)}`)
      ).json()
    ).items,
  ).toHaveLength(1);
  const detail = `/partners/${partner.id}?tab=reviews`;
  await page.goto(detail);
  await expect(page.getByText("Nenhuma avaliação encontrada para esta seleção.")).toBeVisible();
  // Only synthetic E2E accounts and a freshly created synthetic partner receive test reviews.
  const adminUrl =
    process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab";
  if (!process.env.CI && new URL(adminUrl).port !== "5447")
    throw new Error("Local review fixtures require the isolated partners database");
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();
  try {
    await admin.query(
      "INSERT INTO partner_review(source_id,partner_id,author_reference,author_label,rating,comment,submitted_at) VALUES($1,$2,'synthetic-only','Associado sintético',4,'Opinião sintética preservada',now())",
      [randomUUID(), partner.id],
    );
  } finally {
    await admin.end();
  }
  await page.reload();
  await expect(page.getByText("Opinião sintética preservada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ocultar avaliação", exact: true }).click();
  await page.getByLabel("Justificativa da moderação").fill("Motivo sintético preservado");
  await page.route("**/reviews/*", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 503, json: { code: "UNAVAILABLE" } })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Confirmar moderação", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("503");
  await page.unroute("**/reviews/*");
  await page.getByRole("button", { name: "Atualizar avaliações", exact: true }).click();
  await expect(page.getByLabel("Justificativa da moderação")).toHaveValue(
    "Motivo sintético preservado",
  );
  await expect(page.getByText("Carregando avaliações…", { exact: true })).toHaveCount(0);
  await keyboardActivate(
    page,
    page.getByRole("button", { name: "Confirmar moderação", exact: true }),
  );
  await expect(page.getByRole("status").filter({ hasText: "Moderação registrada" })).toBeVisible();
  await expect(page.getByText("Opinião sintética preservada", { exact: true })).toBeVisible();
  const routes = [
    ["unidades", "/partners/units"],
    ["categorias", "/partners/categories"],
    ["configuracoes", "/partners/settings"],
    ["avaliacoes", detail],
  ];
  for (const theme of ["light", "dark"] as const)
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate((value) => localStorage.setItem("caab-theme", value), theme);
      for (const [label, url] of routes) {
        await page.goto(url!);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("main h1")).toBeVisible();
        if (label === "avaliacoes")
          await expect(
            page.getByText("Opinião sintética preservada", { exact: true }),
          ).toBeVisible();
        await expectWcag22AA(page);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`directory-${label}-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
  const final = await (await page.request.get("/api/v1/partners/settings")).json();
  await post(page, "/api/v1/partners/settings", {
    expectedVersion: final.settings.version,
    mode: "all",
    categoryIds: [],
    justification: "Fim da validação isolada",
  });
});
test("directory pages and endpoints reject an account without partner access", async ({ page }) => {
  await signIn(page, false);
  for (const area of ["units", "categories", "settings"]) {
    await page.goto(`/partners/${area}`);
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Você não tem permissão");
    expect((await page.request.get(`/api/v1/partners/${area}`)).status()).toBe(403);
  }
  expect((await page.request.get(`/api/v1/partners/${randomUUID()}/reviews`)).status()).toBe(403);
});
