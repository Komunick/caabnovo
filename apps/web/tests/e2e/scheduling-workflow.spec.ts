import { randomUUID } from "node:crypto";
import { Client } from "pg";
import type { Page, TestInfo } from "@playwright/test";
import { test, expect, syntheticUsers } from "./fixtures";
import { expectWcag22AA, expectThemeContrast } from "./accessibility";

async function choose(page: Page, label: string, name: string) {
  const input = page.getByRole("combobox", { name: label, exact: true });
  await input.fill(name);
  await expect(page.getByRole("option").filter({ hasText: name }).first()).toBeVisible();
  await input.press("ArrowDown");
  await input.press("Enter");
}
async function prepareCapture(page: Page) {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}
async function captureMatrix(page: Page, info: TestInfo, name: string) {
  const viewport = page.viewportSize();
  const theme = await page.locator("html").getAttribute("data-theme");
  try {
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const nextTheme of ["light", "dark"]) {
        await page.locator("html").evaluate((element, value) => {
          element.dataset.theme = value;
        }, nextTheme);
        await expectWcag22AA(page);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await prepareCapture(page);
        await page.screenshot({
          path: info.outputPath(`${name}-${width}-${nextTheme}.png`),
          fullPage: true,
        });
      }
    }
  } finally {
    if (viewport) await page.setViewportSize(viewport);
    await page.locator("html").evaluate((element, value) => {
      if (value === null) delete element.dataset.theme;
      else element.dataset.theme = value;
    }, theme);
  }
}

test("operate capacity, publication, manual decisions, changes and recovery entirely through the panel", async ({
  page,
}, testInfo) => {
  test.setTimeout(300000);
  const suffix = randomUUID().slice(0, 8),
    unitName = `Unidade fluxo ${suffix}`,
    serviceName = `Serviço fluxo ${suffix}`,
    procedureName = `Atendimento fluxo ${suffix}`,
    memberName = `Beneficiário fluxo ${suffix}`;
  const admin = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await admin.connect();
  try {
    await admin.query("INSERT INTO member(name) VALUES($1)", [memberName]);
  } finally {
    await admin.end();
  }
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  const origin = new URL(page.url()).origin;
  async function mutate(path: string, body: unknown, method = "POST") {
    const response = await page.request.fetch(`${origin}/api/v1/scheduling/${path}`, {
      method,
      data: body,
      headers: { origin, "x-csrf-token": randomUUID(), "idempotency-key": randomUUID() },
    });
    expect(response.ok(), await response.text()).toBe(true);
    return response.json();
  }
  const unit = await mutate("units", { name: unitName });
  await mutate(
    `units/${unit.id}/hours`,
    {
      expectedVersion: 1,
      rows: Array.from({ length: 7 }, (_, weekday) => ({
        weekday,
        start: "08:00",
        end: "18:00",
        lunchStart: null,
        lunchEnd: null,
      })),
    },
    "PUT",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/scheduling/catalog?kind=services");
  await page.getByRole("button", { name: "Novo serviço", exact: true }).click();
  await page.getByLabel("Nome", { exact: true }).fill(serviceName);
  await choose(page, "Unidade", unitName);
  await page.getByLabel("Confirmar pedidos imediatamente").uncheck();
  await page.getByLabel("Organização da agenda").selectOption("capacity");
  await page.getByLabel("Nome do primeiro procedimento").fill(procedureName);
  await page.getByLabel("Duração do atendimento (minutos)").fill("60");
  for (const day of ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"])
    await page.getByLabel(day, { exact: true }).check();
  await page.getByLabel("Início do expediente", { exact: true }).fill("08:00");
  await page.getByLabel("Fim do expediente", { exact: true }).fill("18:00");
  await expect(page.getByRole("button", { name: "Salvar", exact: true })).toHaveAttribute(
    "aria-describedby",
    "catalog-save-help",
  );
  await expect(page.getByRole("button", { name: "Publicar", exact: true })).toHaveAttribute(
    "aria-describedby",
    "catalog-publish-help",
  );
  await expectWcag22AA(page);
  await captureMatrix(page, testInfo, "administrative-policy");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("Registro salvo.", { exact: true })).toBeVisible();
  await page.goto("/scheduling/new");
  await choose(page, "Beneficiário", memberName);
  await choose(page, "Unidade", unitName);
  await choose(page, "Serviço", serviceName);
  await choose(page, "Procedimento", procedureName);
  await expect(
    page.getByRole("combobox", { name: "Profissional habilitado", exact: true }),
  ).toHaveCount(0);
  const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel("Data do atendimento").fill(date);
  await expect(page.getByLabel("Vaga disponível")).toBeVisible();
  const slots = page.getByLabel("Vaga disponível");
  await slots.selectOption({ label: "09:00 às 10:00" });
  await page.getByRole("button", { name: "Enviar pedido", exact: true }).click();
  await expect(page).toHaveURL(/\/scheduling\/[0-9a-f-]+$/);
  const bookingUrl = page.url();
  await expect(page.getByText("Aguardando aprovação", { exact: true })).toBeVisible();
  await page.goto("/scheduling/approval");
  await expect(page.getByRole("link", { name: `${memberName} · ${procedureName}` })).toBeVisible();
  await expectWcag22AA(page);
  await captureMatrix(page, testInfo, "administrative-queue");
  await page.goto(bookingUrl);
  await page.getByRole("button", { name: "Aprovar pedido", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar decisão", exact: true }).click();
  await expect(page.getByText("Agendado", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Aviso de confirmação: envio pendente.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remarcar", exact: true }).click();
  await page.getByLabel("Vaga disponível").selectOption({ label: "10:00 às 11:00" });
  await page.getByRole("button", { name: "Enviar pedido", exact: true }).click();
  await expect(page.getByText("0 confirmadas · 1 em andamento", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Recusar pedido", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar decisão", exact: true }).click();
  await expect(page.getByText("Aguardando nova data", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Escolher nova data", exact: true }).click();
  await page.getByLabel("Data do atendimento").fill(date);
  await page.getByLabel("Vaga disponível").selectOption({ label: "11:00 às 12:00" });
  await page.getByRole("button", { name: "Enviar pedido", exact: true }).click();
  await page.getByRole("button", { name: "Aprovar pedido", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar decisão", exact: true }).click();
  await expect(page.getByText("1 confirmada · 0 em andamento", { exact: true })).toBeVisible();
  const recoveryTrigger = page.getByRole("button", {
    name: "Estabelecimento não poderá atender",
    exact: true,
  });
  await page.setViewportSize({ width: 320, height: 800 });
  for (const close of ["Escape", "Fechar", "Voltar"]) {
    await recoveryTrigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const overlap = await dialog.evaluate((element) => {
      const title = element.querySelector("h2")!;
      const range = document.createRange();
      range.selectNodeContents(title);
      const close = element.querySelector('[aria-label="Fechar"]')!.getBoundingClientRect();
      return [...range.getClientRects()].some(
        (r) =>
          r.left < close.right &&
          r.right > close.left &&
          r.top < close.bottom &&
          r.bottom > close.top,
      );
    });
    expect(overlap).toBe(false);
    if (close === "Escape") await page.keyboard.press("Escape");
    else await dialog.getByRole("button", { name: close, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(recoveryTrigger).toBeFocused();
  }
  await page
    .getByRole("button", { name: "Estabelecimento não poderá atender", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar decisão", exact: true }).click();
  await expect(page.getByText("Aguardando nova data", { exact: true })).toBeVisible();
  await expect(page.getByText("1 confirmada · 0 em andamento", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ colorScheme: "dark" });
  await expectWcag22AA(page);
  await expectThemeContrast(
    page,
    ".scheduling-workspace dt, .scheduling-workspace dd, .scheduling-workspace li p, .scheduling-workspace li strong",
  );
  await page.locator("html").evaluate((element) => {
    element.dataset.theme = "dark";
    element.style.colorScheme = "dark";
  });
  await captureMatrix(page, testInfo, "administrative-recovery");
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Cancelar reserva", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar cancelamento", exact: true }).click();
  await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
});
