import { randomUUID } from "node:crypto";
import type { Locator, Page } from "@playwright/test";
import { expect, syntheticUsers, test } from "./fixtures";
import { keyboardActivate, keyboardType, tabTo } from "./keyboard";
import { expectThemeContrast, expectWcag22AA } from "./accessibility";

async function signIn(page: Page, admin = false) {
  const user = admin ? syntheticUsers.administrator : syntheticUsers.ordinary;
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}
async function choose(page: Page, label: string, name: string) {
  const search = page.getByLabel(`Buscar ${label.toLocaleLowerCase("pt-BR")}`, { exact: true });
  await search.fill(name);
  const select = page.getByLabel(`Selecionar ${label.toLocaleLowerCase("pt-BR")}`, { exact: true });
  const option = select.locator("option").filter({ hasText: name }).first();
  await expect(option).toHaveCount(1);
  const value = await option.getAttribute("value");
  await select.selectOption(value!);
}
async function keyboardSelect(page: Page, target: Locator, index = 1) {
  await tabTo(page, target);
  await page.keyboard.press("Home");
  for (let n = 0; n < index; n++) await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
}
async function screenshot(page: Page, path: string) {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.screenshot({ path, fullPage: true });
}
test("configure and manage a real reservation through the panel at 390px, without scheduling grants", async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 390, height: 844 });
  const suffix = randomUUID().slice(0, 8);
  const member = `Pessoa agenda ${suffix}`,
    unit = `Unidade agenda ${suffix}`,
    service = `Serviço agenda ${suffix}`,
    procedure = `Procedimento agenda ${suffix}`,
    professional = `Profissional agenda ${suffix}`;
  await signIn(page, true);
  await page.goto("/members/new");
  await page.getByLabel("Nome completo").fill(member);
  await page.getByRole("button", { name: "Criar cadastro", exact: true }).click();
  await expect(page.getByRole("heading", { name: member, exact: true })).toBeVisible();
  await context.clearCookies();
  await signIn(page);
  await expect(
    page
      .getByRole("navigation", { name: "Atalhos de trabalho" })
      .getByRole("link", { name: "Agendamentos", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agendamentos", exact: true })).toHaveCount(0);
  await page.goto("/scheduling");
  const addReservation = page
    .locator(".page-header")
    .getByRole("link", { name: "Nova reserva", exact: true });
  await expect(addReservation).toBeVisible();
  await expect(addReservation).toHaveClass(/button--add/);
  await expectWcag22AA(page);
  await screenshot(page, testInfo.outputPath("scheduling-agenda-mobile-light.png"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await screenshot(page, testInfo.outputPath("scheduling-agenda-desktop-light.png"));
  await page.setViewportSize({ width: 390, height: 844 });
  const areas: Record<string, [string, string]> = {
    units: ["Unidades", "Nova unidade"],
    services: ["Serviços", "Novo serviço"],
    procedures: ["Procedimentos", "Novo procedimento"],
    professionals: ["Profissionais", "Novo profissional"],
    assignments: ["Habilitações", "Nova habilitação"],
  };
  async function open(kind: string) {
    const [area, action] = areas[kind]!;
    await keyboardActivate(
      page,
      page
        .getByRole("navigation", { name: "Agendamentos", exact: true })
        .getByRole("link", { name: area, exact: true }),
    );
    await expect(page).toHaveURL(new RegExp(`kind=${kind}`));
    await page.reload();
    await expect(
      page
        .getByRole("navigation", { name: "Agendamentos", exact: true })
        .getByRole("link", { name: area, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    const add = page.locator(".page-header").getByRole("button", { name: action, exact: true });
    await expect(add).toHaveClass(/button--add/);
    await keyboardActivate(page, add);
    await expect(page.getByRole("heading", { name: action, exact: true })).toBeVisible();
  }
  async function save() {
    await keyboardActivate(
      page,
      page.getByRole("button", { name: "Salvar registro", exact: true }),
    );
    await expect(page.getByText("Registro salvo.", { exact: true })).toBeVisible();
  }
  await open("units");
  await keyboardType(page, page.getByLabel("Nome", { exact: true }), unit);
  await page.route("**/api/v1/scheduling/units", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "INTERNAL_ERROR" } }),
        })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Salvar registro", exact: true }).click();
  await expect(page.locator(".scheduling-workspace").getByRole("alert")).toContainText(
    "Não foi possível concluir",
  );
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue(unit);
  await page.unroute("**/api/v1/scheduling/units");
  await save();
  await open("services");
  await page.getByLabel("Nome", { exact: true }).fill(service);
  await choose(page, "Unidade", unit);
  await save();
  await open("procedures");
  await page.getByLabel("Nome", { exact: true }).fill(procedure);
  await choose(page, "Unidade", unit);
  await choose(page, "Serviço", service);
  await page.getByLabel("Duração em minutos").fill("60");
  await save();
  await open("professionals");
  await page.getByLabel("Nome", { exact: true }).fill(professional);
  await save();
  await open("assignments");
  await choose(page, "Unidade", unit);
  await choose(page, "Serviço", service);
  await choose(page, "Procedimento", procedure);
  await choose(page, "Profissional", professional);
  await save();
  await screenshot(page, testInfo.outputPath("scheduling-catalog-mobile-light.png"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await screenshot(page, testInfo.outputPath("scheduling-catalog-desktop-light.png"));
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const catalogTable = page.locator(".scheduling-workspace .table-scroll");
  await catalogTable.focus();
  await page.keyboard.press("End");
  await expect(catalogTable).toBeFocused();
  await page
    .getByRole("button", { name: `Editar ${professional} — ${procedure}`, exact: true })
    .click();
  await expect(
    page.getByLabel("Selecionar unidade", { exact: true }).locator("option:checked"),
  ).toHaveText(unit);
  await expect(
    page.getByLabel("Selecionar serviço", { exact: true }).locator("option:checked"),
  ).toHaveText(service);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const weekday = new Date(`${date}T12:00:00-03:00`).getUTCDay();
  const day = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ][weekday]!;
  await page.goto("/scheduling/hours");
  await choose(page, "Unidade", unit);
  await page.getByLabel(`Atendimento em ${day}`, { exact: true }).check();
  await page.locator(".scheduling-workspace").getByLabel("Início", { exact: true }).fill("08:00");
  await page.getByLabel("Fim", { exact: true }).fill("17:00");
  await keyboardActivate(page, page.getByRole("button", { name: "Salvar horários" }));
  await expect(page.getByText("Horários salvos.", { exact: true })).toBeVisible();
  await page.getByLabel("Configurar", { exact: true }).selectOption("professionals");
  await choose(page, "Profissional", professional);
  await page.getByLabel(`Atendimento em ${day}`, { exact: true }).check();
  await page.locator(".scheduling-workspace").getByLabel("Início", { exact: true }).fill("08:00");
  await page.getByLabel("Fim", { exact: true }).fill("17:00");
  await page.getByLabel("Início do almoço (opcional)").fill("12:00");
  await page.getByLabel("Fim do almoço (opcional)").fill("13:00");
  await keyboardActivate(page, page.getByRole("button", { name: "Salvar horários" }));
  await expect(page.getByText("Horários salvos.", { exact: true })).toBeVisible();
  await expectWcag22AA(page);
  await screenshot(page, testInfo.outputPath("scheduling-hours-mobile-light.png"));
  await page
    .locator(".page-header")
    .getByRole("link", { name: "Nova reserva", exact: true })
    .click();
  await choose(page, "Beneficiário", member);
  await choose(page, "Unidade", unit);
  await choose(page, "Serviço", service);
  await choose(page, "Procedimento", procedure);
  await choose(page, "Profissional habilitado", professional);
  await page.getByLabel("Data do atendimento").fill(date);
  const slot = page.getByLabel("Vaga disponível");
  await expect(slot.locator("option")).toHaveCount(9);
  await keyboardSelect(page, slot);
  const firstSlot = await slot.inputValue();
  await expectWcag22AA(page);
  await screenshot(page, testInfo.outputPath("scheduling-reserve-mobile-light.png"));
  await keyboardActivate(
    page,
    page.getByRole("button", { name: "Confirmar reserva", exact: true }),
  );
  await expect(page).toHaveURL(/\/scheduling\/[0-9a-f-]+$/);
  const detailUrl = page.url();
  await page.reload();
  await expect(page.getByRole("heading", { name: member, exact: true })).toBeVisible();
  await expect(page.getByText("Reserva criada", { exact: true })).toBeVisible();
  await page.goto(`/scheduling?date=${date}&q=${encodeURIComponent(member)}`);
  await expect(page.getByRole("row").filter({ hasText: member })).toContainText("08:00 às 09:00");
  await expect(page.getByRole("row").filter({ hasText: member })).toContainText(professional);
  await page.reload();
  await expect(page.getByLabel("Nome do beneficiário")).toHaveValue(member);
  await keyboardActivate(
    page,
    page.getByRole("link", { name: new RegExp(`Ver reserva de ${member}`) }),
  );
  await expect(page).toHaveURL(detailUrl);
  await keyboardActivate(page, page.getByRole("button", { name: "Remarcar", exact: true }));
  await expect(page.getByLabel("Vaga disponível").locator("option")).toHaveCount(9);
  await keyboardSelect(page, page.getByLabel("Vaga disponível"), 2);
  await keyboardActivate(
    page,
    page.getByRole("button", { name: "Confirmar remarcação", exact: true }),
  );
  await expect(page.getByText("Reserva remarcada.", { exact: true })).toBeVisible();
  await expect(page.getByText("Reserva remarcada", { exact: true })).toBeVisible();
  await expectThemeContrast(
    page,
    ".scheduling-workspace dt, .scheduling-workspace dd, .scheduling-workspace li p, .scheduling-workspace li strong, .scheduling-workspace [role=status]",
  );
  await page.locator("html").evaluate((element) => {
    element.dataset.theme = "dark";
    element.style.colorScheme = "dark";
  });
  await expectWcag22AA(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await screenshot(page, testInfo.outputPath("scheduling-detail-mobile-dark.png"));
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator(".topbar-context strong")).toHaveText("Agendamentos");
  await screenshot(page, testInfo.outputPath("scheduling-detail-desktop-dark.png"));
  await page.locator("html").evaluate((element) => {
    element.dataset.theme = "light";
    element.style.colorScheme = "light";
  });
  await expectWcag22AA(page);
  await screenshot(page, testInfo.outputPath("scheduling-detail-desktop-light.png"));
  await page.setViewportSize({ width: 390, height: 844 });
  const cancel = page.getByRole("button", { name: "Cancelar reserva", exact: true });
  await keyboardActivate(page, cancel);
  const dialog = page.getByRole("dialog", { name: "Cancelar esta reserva?" });
  await expectWcag22AA(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Enter");
  await keyboardActivate(page, dialog.getByRole("button", { name: "Confirmar cancelamento" }));
  await expect(page.getByText("Reserva cancelada. O horário foi liberado.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Cancelado", { exact: true })).toBeVisible();
  await expect(page.getByText("Reserva cancelada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remarcar", exact: true })).toHaveCount(0);
  await page.goto("/scheduling/new");
  await choose(page, "Beneficiário", member);
  await choose(page, "Unidade", unit);
  await choose(page, "Serviço", service);
  await choose(page, "Procedimento", procedure);
  await choose(page, "Profissional habilitado", professional);
  await page.getByLabel("Data do atendimento").fill(date);
  await expect(
    page.getByLabel("Vaga disponível").locator(`option[value="${firstSlot}"]`),
  ).toHaveCount(1);
});

test("agenda handles an empty result and retry without exposing server messages", async ({
  page,
}) => {
  await signIn(page);
  await page.route("**/api/v1/scheduling/bookings?**", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "INTERNAL_ERROR", message: "postgres secret technical detail" },
      }),
    }),
  );
  await page.goto("/scheduling");
  await expect(page.locator(".scheduling-workspace").getByRole("alert")).toContainText(
    "Não foi possível concluir",
  );
  await expect(page.getByText("postgres secret technical detail")).toHaveCount(0);
  await page.unroute("**/api/v1/scheduling/bookings?**");
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await page.getByLabel("Nome do beneficiário").fill(`Sem resultado ${randomUUID()}`);
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByText("Nenhuma reserva encontrada para esses filtros.")).toBeVisible();
  await expectWcag22AA(page);
});
