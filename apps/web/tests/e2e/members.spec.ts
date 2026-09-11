import { randomUUID } from "node:crypto";
import type { Locator, Page } from "@playwright/test";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
import { keyboardActivate, keyboardType, tabTo } from "./keyboard";

async function keyboardSelect(page: Page, target: Locator, value: string) {
  const index = await target
    .locator("option")
    .evaluateAll(
      (options, wanted) =>
        options.findIndex((option) => (option as HTMLOptionElement).value === wanted),
      value,
    );
  expect(index).toBeGreaterThanOrEqual(0);
  await tabTo(page, target);
  await page.keyboard.press("Home");
  for (let step = 0; step < index; step++) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(target).toHaveValue(value);
}
async function signIn(page: Page, administrator = true) {
  const user = administrator ? syntheticUsers.administrator : syntheticUsers.ordinary;
  await page.goto("/login");
  await keyboardType(page, page.getByLabel("E-mail"), user.email);
  await keyboardType(page, page.getByLabel("Senha", { exact: true }), user.password);
  await keyboardActivate(page, page.getByRole("button", { name: "Entrar" }));
  await expect(page).toHaveURL(/\/$/);
}
async function create(page: Page, name: string) {
  await page.goto("/members/new");
  await keyboardType(page, page.getByLabel("Nome completo"), name);
  await keyboardType(
    page,
    page.getByLabel("Motivo do cadastro ou alteração"),
    "Cadastro sintético de teste",
  );
  await keyboardActivate(page, page.getByRole("button", { name: "Criar cadastro" }));
  await expect(page).toHaveURL(/\/members\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  return page.url();
}

test("birth calendar and contact masks work without saving a member", async ({ page }) => {
  await signIn(page);
  await page.goto("/members/new");
  const trigger = page.getByRole("button", { name: "Abrir calendário de nascimento" });
  await trigger.click();
  const calendar = page.getByRole("dialog", { name: "Data de nascimento" });
  await calendar.getByLabel("Ano", { exact: true }).fill("2000");
  await calendar.getByLabel("Mês", { exact: true }).selectOption("1");
  await calendar.getByRole("button", { name: "29 de Fevereiro de 2000", exact: true }).click();
  await expect(page.getByLabel("Nascimento (opcional)")).toHaveValue("2000-02-29");
  await expect(trigger).toBeFocused();
  await trigger.press("Enter");
  await expect(calendar).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(calendar).toBeHidden();
  const cpf = page.getByLabel("CPF (opcional)");
  await cpf.pressSequentially("abc1234567890123");
  await expect(cpf).toHaveValue("123.456.789-01");
  await cpf.fill("");
  const phone = page.getByLabel("Telefone (opcional)");
  await phone.pressSequentially("abc7191234567890");
  await expect(phone).toHaveValue("(71) 91234-5678");
  await phone.fill("(71) 3456-7890");
  await expect(phone).toHaveValue("(71) 3456-7890");
  const email = page.getByLabel("E-mail de contato (opcional)");
  await email.fill("invalido@dominio");
  await email.press("Tab");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  expect(await email.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(false);
  await email.fill("pessoa@example.test");
  await expect(page.locator("#member-email-error")).toHaveCount(0);
  expect(await email.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(true);
});

test("administrator manages people, relationships, independent assessments and archive by keyboard at 390px", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  const suffix = randomUUID().slice(0, 8);
  const dependent = `Dependente ${suffix}`;
  await create(page, dependent);
  const name = `Associado ${suffix}`;
  const holderUrl = await create(page, name);
  const administrative = page.getByRole("region", { name: "Situação administrativa", exact: true });
  await expect(administrative).toContainText("Não ativado");
  for (const [action, confirm, status] of [
    ["Ativar associado", "Confirmar ativação", "Ativo"],
    ["Bloquear associado", "Confirmar bloqueio", "Bloqueado"],
    ["Desbloquear associado", "Confirmar desbloqueio", "Ativo"],
  ] as const) {
    await keyboardActivate(page, administrative.getByRole("button", { name: action, exact: true }));
    await keyboardType(
      page,
      page.getByLabel("Justificativa da mudança de situação"),
      `Decisão sintética: ${action}`,
    );
    await keyboardActivate(
      page,
      administrative.getByRole("button", { name: confirm, exact: true }),
    );
    await expect(administrative.getByText(status, { exact: true })).toBeVisible();
  }
  await expectWcag22AA(page);
  await keyboardActivate(page, page.getByRole("button", { name: "Dependentes", exact: true }));
  await keyboardType(page, page.getByLabel("Buscar pessoa pelo nome"), dependent);
  await keyboardActivate(page, page.getByRole("button", { name: "Buscar pessoa", exact: true }));
  await expect(page.getByLabel("Pessoa encontrada")).toBeVisible();
  await keyboardType(page, page.getByLabel("Relação declarada"), "Vínculo sintético");
  await keyboardType(page, page.getByLabel("Justificativa do vínculo"), "Documento de teste");
  await keyboardActivate(page, page.getByRole("button", { name: "Vincular dependente" }));
  await expect(page.getByRole("link", { name: dependent, exact: true })).toBeVisible();
  await keyboardActivate(page, page.getByRole("button", { name: "Situações", exact: true }));
  await keyboardSelect(page, page.getByLabel("Resultado", { exact: true }), "approved");
  await keyboardType(page, page.getByLabel("Fonte ou regra aplicada"), "Regra sintética");
  await keyboardType(page, page.getByLabel("Motivo da decisão"), "Avaliação sintética");
  await keyboardActivate(
    page,
    page.getByRole("button", { name: "Registrar avaliação", exact: true }),
  );
  await expect(
    page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Análise cadastral", exact: true }) }),
  ).toContainText("Aprovado");
  await expect(
    page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Elegibilidade", exact: true }) }),
  ).toContainText("Não avaliada");
  await expectWcag22AA(page);
  await keyboardActivate(page, page.getByRole("button", { name: "Cadastro", exact: true }));
  await keyboardType(page, page.getByLabel("Nome completo"), `${name} corrigido`);
  await keyboardType(
    page,
    page.getByLabel("Motivo do cadastro ou alteração"),
    "Correção de identificação sintética",
  );
  await keyboardActivate(page, page.getByRole("button", { name: "Salvar cadastro" }));
  await expect(page.getByRole("heading", { name: `${name} corrigido`, exact: true })).toBeVisible();
  await keyboardActivate(page, page.getByRole("button", { name: "Situações", exact: true }));
  await expect(
    page.getByText("Identificação alterada após esta avaliação. Revise a decisão."),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("associados-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await keyboardActivate(page, page.getByRole("button", { name: "Cadastro", exact: true }));
  await keyboardType(
    page,
    page.getByLabel("Motivo do arquivamento ou restauração"),
    "Arquivamento sintético",
  );
  await keyboardActivate(
    page,
    page.getByRole("button", { name: "Arquivar cadastro", exact: true }),
  );
  await expect(page.getByRole("button", { name: "Restaurar cadastro" })).toBeVisible();
  await keyboardActivate(page, page.getByRole("button", { name: "Restaurar cadastro" }));
  await expect(page.getByRole("button", { name: "Arquivar cadastro", exact: true })).toBeVisible();
  await keyboardActivate(page, page.getByRole("button", { name: "Histórico", exact: true }));
  await expect(page.getByText("Cadastro restaurado", { exact: true })).toBeVisible();
  await expectWcag22AA(page);
  await page.goto(holderUrl);
});

test("selection filters apply immediately and preserve search, pagination and history", async ({
  page,
  browserName,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  const prefix = `Filtro ${randomUUID().slice(0, 8)}`;
  // API setup creates only synthetic members; form controls are exercised by keyboard.
  for (let index = 0; index < 27; index++) {
    const state = index === 26 ? "RJ" : "BA";
    const response = await page.request.post("/api/v1/members", {
      headers: {
        origin: new URL(page.url()).origin,
        "x-csrf-token": randomUUID(),
        "idempotency-key": randomUUID(),
      },
      data: {
        profile: {
          name: `${prefix} ${state} ${String(index).padStart(2, "0")}`,
          oab: {
            state,
            type: "lawyer",
            number: randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase(),
          },
        },
        justification: "Filtro sintético de teste",
      },
    });
    expect(response.status()).toBe(201);
  }
  await page.goto("/members");
  await keyboardType(page, page.getByLabel("Nome, CPF ou inscrição OAB"), prefix);
  await keyboardActivate(page, page.getByRole("button", { name: "Filtros", exact: true }));
  await page.getByLabel("Estado da OAB", { exact: true }).selectOption("BA");
  await expect(page).toHaveURL(/oabState=BA/);
  await expect(page.getByRole("table").getByRole("link")).toHaveCount(25);
  await expect(page.getByRole("link", { name: `${prefix} RJ 26` })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Próxima página" })).toHaveAttribute(
    "href",
    /oabState=BA/,
  );
  const nextPage = page.getByRole("link", { name: "Próxima página" });
  // WebKit on Windows skips links in native tab navigation, even with Alt+Tab.
  // Keep keyboard pagination coverage in Chromium/Firefox and functional coverage in WebKit.
  if (browserName === "webkit" && process.platform === "win32") await nextPage.click();
  else await keyboardActivate(page, nextPage);
  await expect(page.getByRole("table").getByRole("link")).toHaveCount(1);
  await expect(page.getByRole("link", { name: `${prefix} BA 25` })).toBeVisible();
  await expect(page.getByLabel("Estado da OAB", { exact: true })).toHaveValue("BA");
  await expect(page.getByLabel("Nome, CPF ou inscrição OAB")).toHaveValue(prefix);
  await page.getByLabel("Estado da OAB", { exact: true }).selectOption("RJ");
  await expect(page).toHaveURL(/oabState=RJ/);
  await expect(page.getByRole("link", { name: `${prefix} RJ 26` })).toBeVisible();
  await expect(page.getByText("Página 1", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Estado da OAB", { exact: true })).toHaveValue("BA");
  await expect(page.getByText("Página 2", { exact: true })).toBeVisible();
  await page.getByLabel("Análise cadastral", { exact: true }).selectOption("approved");
  await expect(page).toHaveURL(/registrationStatus=approved/);
  await expect(page.getByText("Página 1", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Nenhum cadastro encontrado. Ajuste a busca ou crie uma pessoa."),
  ).toBeVisible();
  await page.getByLabel("Exibir", { exact: true }).selectOption("archived");
  await expect(page).toHaveURL(/archived=archived/);
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page.getByLabel("Nome, CPF ou inscrição OAB")).toHaveValue("");
  await expect(page.getByLabel("Estado da OAB", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Análise cadastral", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Exibir", { exact: true })).toHaveValue("active");
  await page.getByLabel("Nome, CPF ou inscrição OAB").fill(prefix);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("table").getByRole("link")).toHaveCount(25);
  await page.getByLabel("Estado da OAB", { exact: true }).focus();
  await page.keyboard.press("End");
  await expect(page).toHaveURL(/oabState=TO/);
  await expect(page.getByLabel("Estado da OAB", { exact: true })).toBeFocused();
  await expectWcag22AA(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("documents use real upload, scan, review, replacement and private download", async ({
  page,
}) => {
  test.setTimeout(150000);
  await signIn(page);
  await create(page, `Documentos ${randomUUID().slice(0, 8)}`);
  await page.getByRole("button", { name: "Documentos", exact: true }).click();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0XcAAAAASUVORK5CYII=",
    "base64",
  );
  async function upload(name: string) {
    await page
      .getByLabel("Enviar arquivo privado", { exact: false })
      .setInputFiles({ name, mimeType: "image/png", buffer: png });
    await expect(page.getByRole("status").filter({ hasText: "Arquivo enviado" })).toBeVisible({
      timeout: 30000,
    });
    await expect(async () => {
      await page.getByRole("button", { name: "Atualizar arquivos", exact: true }).click();
      expect(
        await page
          .getByLabel("Arquivo liberado", { exact: true })
          .locator("option")
          .filter({ hasText: name })
          .count(),
      ).toBe(1);
    }).toPass({ timeout: 60000, intervals: [1000, 2000] });
    await page.getByLabel("Arquivo liberado", { exact: true }).selectOption({ label: name });
  }
  await upload("documento.png");
  await page.getByLabel("Categoria do documento", { exact: true }).fill("Identificação sintética");
  await page.getByLabel("Motivo do envio ou substituição").fill("Documento de teste");
  await page.getByRole("button", { name: "Anexar documento", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Abrir documento Identificação sintética" }),
  ).toBeVisible();
  await page
    .getByLabel("Resultado da análise", { exact: true })
    .selectOption("correction_requested");
  await page
    .getByLabel("Motivo da análise ou correção solicitada")
    .fill("Solicitar versão legível sintética");
  await page.getByRole("button", { name: "Registrar análise do documento" }).click();
  await expect(page.getByText("Correção solicitada", { exact: false }).first()).toBeVisible();
  await upload("substituto.png");
  await page.getByLabel("Documento substituído (opcional)").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Anexar documento", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Abrir documento Identificação sintética" }),
  ).toHaveCount(2);
  const href = await page
    .getByRole("link", { name: "Abrir documento Identificação sintética" })
    .first()
    .getAttribute("href");
  const download = await page.request.get(href!);
  expect(download.ok()).toBe(true);
  expect(download.headers()["content-type"]).toContain("image/png");
  await expectWcag22AA(page);
});

test("ordinary account cannot list, create, read or download members", async ({ page }) => {
  await signIn(page, false);
  await expect(page.getByRole("link", { name: "Associados", exact: true })).toHaveCount(0);
  const id = randomUUID();
  for (const path of ["/members", "/members/new", `/members/${id}`]) {
    await page.goto(path);
    await expect(
      page.getByRole("alert").filter({ hasText: "Você não tem permissão" }),
    ).toBeVisible();
  }
  for (const path of [
    "",
    `/${id}`,
    `/${id}/history`,
    `/${id}/files`,
    `/${id}/files/${randomUUID()}`,
  ]) {
    const response = await page.request.get(`/api/v1/members${path}`);
    expect(response.status()).toBe(403);
  }
});
