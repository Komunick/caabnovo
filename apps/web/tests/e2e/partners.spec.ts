import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
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
test("operator creates a partner, approves a contract and publishes an offer with accessible views", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  await signIn(page);
  await page.goto("/partners");
  await expect(page.getByRole("heading", { name: "Parceiros", exact: true })).toBeVisible();
  await expectWcag22AA(page);
  await page.getByRole("link", { name: "Novo parceiro", exact: true }).click();
  const name = `Parceiro sintético ${randomUUID().slice(0, 8)}`;
  await keyboardType(page, page.getByLabel("Nome do parceiro", { exact: true }), name);
  await keyboardType(page, page.getByLabel("Categoria", { exact: true }), "Bem-estar");
  await keyboardType(page, page.locator("#partner-reason"), "Cadastro sintético para validação");
  await keyboardActivate(page, page.getByRole("button", { name: "Criar parceiro", exact: true }));
  await expect(page).toHaveURL(/\/partners\/[0-9a-f-]+$/);
  const detail = page.url();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.getByLabel("Pessoa de contato (opcional)").fill("Contato ainda em edição");
  await page.route("**/history?page=1", (route) =>
    route.fulfill({ status: 503, json: { code: "UNAVAILABLE" } }),
  );
  await page.getByRole("button", { name: "Histórico", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Não foi possível carregar o histórico",
  );
  await expect(page.getByText("Carregando histórico…", { exact: true })).toHaveCount(0);
  await page.unroute("**/history?page=1");
  await keyboardActivate(
    page,
    page.getByRole("button", { name: "Tentar carregar histórico novamente" }),
  );
  await expect(page.getByText(/Administrador Sintético cadastrou o parceiro/)).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Cadastro", exact: true }).click();
  await expect(page.getByLabel("Pessoa de contato (opcional)")).toHaveValue(
    "Contato ainda em edição",
  );
  await page.getByRole("button", { name: "Unidades", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar unidade", exact: true }).click();
  await page.getByLabel("Nome da unidade").fill("Unidade Salvador");
  await page.getByLabel("Cidade (opcional)", { exact: true }).fill("Salvador");
  await page.getByLabel("Estado (UF) (opcional)", { exact: true }).fill("BA");
  await page.locator("#unit-reason").fill("Unidade sintética");
  await page.getByRole("button", { name: "Salvar unidade", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Unidade Salvador", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Contratos", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar contrato", exact: true }).click();
  await page.getByLabel("Referência do contrato").fill("Convênio sintético");
  await page
    .getByLabel("Condições do contrato")
    .fill("Condições aprovadas para demonstração isolada.");
  await page.getByLabel("Início da vigência").fill("2020-01-01");
  await page.getByLabel("Fim da vigência").fill("2099-12-31");
  await page.getByLabel("Enviar PDF, PNG ou JPEG, até 25 MB").setInputFiles({
    name: "contrato-sintetico.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByRole("status").filter({ hasText: "Arquivo enviado." })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole("option", { name: "contrato-sintetico.png — Liberado" })).toBeEnabled(
    { timeout: 60000 },
  );
  await page
    .getByLabel("Documento do contrato", { exact: true })
    .selectOption({ label: "contrato-sintetico.png — Liberado" });
  await page.screenshot({
    path: testInfo.outputPath("partners-contract-form.png"),
    fullPage: true,
  });
  await page.locator("#contract-reason").fill("Registro sintético");
  await page.getByRole("button", { name: "Registrar contrato", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Convênio sintético", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Aprovar contrato", exact: true }).click();
  await page.locator("#contract-decision-reason").fill("Aprovação sintética");
  await page.getByRole("button", { name: "Confirmar aprovação", exact: true }).click();
  await expect(page.getByText("Aprovado ·", { exact: false })).toBeVisible();
  const download = await page.request.get(
    (await page
      .getByRole("link", { name: "Baixar documento", exact: true })
      .getAttribute("href")) ?? "",
    { maxRedirects: 0 },
  );
  expect(download.status()).toBe(307);
  await page.getByRole("button", { name: "Benefícios", exact: true }).click();
  await page.getByRole("button", { name: "Adicionar benefício", exact: true }).click();
  await page.getByLabel("Título", { exact: true }).fill("Atendimento com condição especial");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Uma oferta sintética para validar a apresentação.");
  await page
    .getByLabel("Condições de uso", { exact: true })
    .fill("Apresente a identificação informada no convênio.");
  await page
    .getByLabel("Público do benefício", { exact: true })
    .fill("Público definido no contrato");
  await page.getByLabel("Unidade", { exact: true }).selectOption({ label: "Unidade Salvador" });
  await page
    .getByLabel("Contrato", { exact: true })
    .selectOption({ label: "Convênio sintético · aprovado" });
  await page.getByLabel("Início da oferta").fill("2020-01-01");
  await page.getByLabel("Fim da oferta").fill("2099-12-31");
  await page.getByLabel("Site", { exact: true }).check();
  await page.locator("#benefit-reason").fill("Oferta sintética");
  await expectWcag22AA(page);
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("partners-benefit-saved.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await page.locator("#benefit-publish-reason").fill("Publicação sintética no banco isolado");
  await page.getByRole("button", { name: "Confirmar publicação", exact: true }).click();
  await expect(page.getByText("Em exibição ·", { exact: false })).toBeVisible();
  const visible = await page.request.get("/api/v1/benefits/site");
  expect(visible.status()).toBe(200);
  expect(
    (await visible.json()).items.some(
      (item: { partner: { name: string } }) => item.partner.name === name,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Editar benefício", exact: true }).click();
  await page.getByLabel("Título", { exact: true }).fill("Título privado em revisão");
  await page.getByLabel("Fim da oferta").fill("2098-12-31");
  await page.locator("#benefit-reason").fill("Revisão privada sintética");
  await page.getByRole("button", { name: "Salvar rascunho", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Título privado em revisão", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Em exibição · Vigência publicada: 01/01/2020 a 31/12/2099"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Conferir versão publicada", exact: true }).click();
  const publication = page.getByRole("article", { name: "Prévia da versão publicada" });
  await expect(
    publication.getByRole("heading", { name: "Atendimento com condição especial" }),
  ).toBeVisible();
  await expect(publication).toContainText("31/12/2099");
  const afterDraft = await page.request.get("/api/v1/benefits/site");
  const publicOffer = (await afterDraft.json()).items.find(
    (item: { partner: { name: string } }) => item.partner.name === name,
  );
  expect(publicOffer.title).toBe("Atendimento com condição especial");
  expect(publicOffer.endsOn).toBe("2099-12-31");
  const routes = [
    ["cadastros", "/partners"],
    ["novo", "/partners/new"],
    ["detalhe", detail],
    ["beneficios", "/partners/benefits"],
  ] as const;
  for (const theme of ["light", "dark"])
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme as "light" | "dark" });
      await page.evaluate((value) => localStorage.setItem("caab-theme", value), theme);
      for (const [label, url] of routes) {
        await page.goto(url);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("main h1")).toBeVisible();
        await expectWcag22AA(page);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`partners-${label}-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
  await page.goto("/partners");
  await page.getByLabel("Nome ou CNPJ").fill(name);
  await page.getByLabel("Nome ou CNPJ").press("Enter");
  const row = page.getByRole("row").filter({ hasText: name });
  const cell = row.getByRole("cell").nth(1);
  await cell.scrollIntoViewIfNeeded();
  const box = await cell.boundingBox();
  expect(box).not.toBeNull();
  // A real pointer click on another column must activate the stretched row link.
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(page).toHaveURL(detail);
  await page.getByRole("button", { name: "Histórico", exact: true }).click();
  await expect(page.getByText(/Administrador Sintético publicou um benefício/)).toBeVisible();
  await expectWcag22AA(page);
  await page.getByRole("button", { name: "Benefícios", exact: true }).click();
  await page.getByRole("button", { name: "Retirar de exibição", exact: true }).click();
  await page.locator("#benefit-publish-reason").fill("Fim da validação sintética");
  await page.getByRole("button", { name: "Confirmar retirada", exact: true }).click();
  await expect(page.getByText("Rascunho ·", { exact: false })).toBeVisible();
});
test("account without partner access cannot open screens or call private endpoints", async ({
  page,
}) => {
  await signIn(page, false);
  await page.goto("/partners");
  await expect(page.getByRole("alert").filter({ hasText: "Você não tem permissão" })).toBeVisible();
  const response = await page.request.get("/api/v1/partners");
  expect(response.status()).toBe(403);
  await expect(
    page
      .getByRole("navigation", { name: "Navegação administrativa" })
      .getByRole("link", { name: "Parceiros", exact: true }),
  ).toHaveCount(0);
});
