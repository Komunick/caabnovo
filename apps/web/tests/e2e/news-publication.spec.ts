import { expectNoNewsReasonFields } from "./news-justification";
import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { expect as baseExpect, syntheticUsers, test } from "./fixtures";

// Match the editor journeys when localhost compiles a route on its first request.
const expect = baseExpect.configure({ timeout: 15000 });

async function prepare(page: import("@playwright/test").Page, media = false) {
  await page.goto("/login");
  const user = media ? syntheticUsers.accessManager : syntheticUsers.ordinary;
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/news/new");
  await page.getByLabel("Título", { exact: true }).fill("Notícia pública sintética");
  await page
    .getByRole("textbox", { name: "Conteúdo da notícia", exact: true })
    .fill("Conteúdo público <script>texto seguro</script>");
  await page.getByLabel("Destacar notícia").check();
  await page.getByLabel("Ordem do destaque").fill("2");
  await expectNoNewsReasonFields(page);
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/);
  return page.url().split("/").at(-1)!;
}
async function confirm(page: import("@playwright/test").Page) {
  await expectNoNewsReasonFields(page);
  const button = page.getByRole("dialog").getByRole("button", { name: "Confirmar", exact: true });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 60000 });
}
test("the worker releases a real image and publishes the scheduled revision for anonymous readers", async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  const worker = spawn(process.execPath, ["--import", "tsx", "apps/worker/src/main.ts"], {
    cwd: resolve(process.cwd()),
    env: process.env,
    windowsHide: true,
    stdio: "ignore",
  });
  try {
    const id = await prepare(page, true);
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=",
      "base64",
    );
    await page
      .getByLabel("Enviar imagem", { exact: true })
      .setInputFiles({ name: "publicacao-sintetica.png", mimeType: "image/png", buffer: image });
    await expect(
      page.getByRole("status").filter({ hasText: "Imagem enviada para verificação" }),
    ).toBeVisible({ timeout: 20000 });
    await page.getByLabel("Descrição da capa", { exact: true }).fill("Capa pública sintética");
    const fileId = (await (await page.request.get(`/api/v1/news/${id}/media`)).json()).items[0].id;
    await expect
      .poll(
        async () => {
          const data = await (await page.request.get(`/api/v1/news/${id}/media`)).json();
          return data.items.find((file: { id: string }) => file.id === fileId)?.usable;
        },
        { timeout: 60000 },
      )
      .toBe(true);
    await expectNoNewsReasonFields(page);
    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Rascunho salvo. Revisão 2." }),
    ).toBeVisible();
    const destinations = page.getByRole("group", { name: "Destinos da ação" });
    await destinations.getByLabel("Aplicativo", { exact: true }).check();
    // datetime-local has minute precision. Leave at least 30 seconds for saving and checking the draft.
    const at = Math.ceil((Date.now() + 30000) / 60000) * 60000;
    await page
      .getByLabel("Data e horário de Brasília", { exact: true })
      .fill(new Date(at - 3 * 3600000).toISOString().slice(0, 16));
    await page.getByRole("button", { name: "Agendar", exact: true }).click();
    await confirm(page);
    await page.getByLabel("Título", { exact: true }).fill("Rascunho posterior ao agendamento");
    await expectNoNewsReasonFields(page);
    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Rascunho salvo. Revisão 3." }),
    ).toBeVisible();
    await expect
      .poll(async () => (await request.get(`/api/v1/content/app/news/${id}`)).status(), {
        timeout: 100000,
        intervals: [1000, 2000],
      })
      .toBe(200);
    expect(await (await request.get(`/api/v1/content/app/news/${id}`)).json()).toMatchObject({
      title: "Notícia pública sintética",
      cover: { fileId, alt: "Capa pública sintética" },
    });
    const delivered = await request.get(`/api/v1/content/app/news/${id}/media/${fileId}`);
    expect(delivered.status()).toBe(200);
    expect(await delivered.body()).toEqual(image);
    await page.reload();
    await expect(page.getByLabel("Título", { exact: true })).toHaveValue(
      "Rascunho posterior ao agendamento",
    );
    await expect(page.getByText(/Concluído/)).toBeVisible();
    await page.goto("/news");
    const thumbnail = page.locator(`a[href="/news/${id}"] img`);
    await expect(thumbnail).toBeVisible();
    await expect
      .poll(() =>
        thumbnail.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      )
      .toBe(true);
    await page.goto(`/news/${id}`);
    await page.getByRole("button", { name: "Arquivar", exact: true }).click();
    await confirm(page);
    expect((await request.get(`/api/v1/content/app/news/${id}/media/${fileId}`)).status()).toBe(
      404,
    );
  } finally {
    worker.kill("SIGTERM");
    await new Promise<void>((resolveDone) => {
      if (worker.exitCode !== null || worker.signalCode !== null) return resolveDone();
      worker.once("exit", () => resolveDone());
      setTimeout(() => {
        worker.kill("SIGKILL");
        resolveDone();
      }, 5000).unref();
    });
  }
});
test("publishes, explicitly withdraws and saves a draft, schedules and withdraws per channel", async ({
  page,
  request,
  browser,
}, testInfo) => {
  test.setTimeout(120000);
  const id = await prepare(page),
    destinations = page.getByRole("group", { name: "Destinos da ação" });
  expect((await request.get(`/api/v1/content/app/news/${id}`)).status()).toBe(404);
  await destinations.getByLabel("Aplicativo", { exact: true }).check();
  await expectNoNewsReasonFields(page);
  await page.getByRole("button", { name: "Publicar agora", exact: true }).click();
  await confirm(page);
  const published = await request.get(`/api/v1/content/app/news/${id}`);
  expect(published.status()).toBe(200);
  expect(await published.json()).toMatchObject({
    revision: 2,
    highlight: { order: 2 },
    title: "Notícia pública sintética",
  });
  expect((await request.get(`/api/v1/content/site/news/${id}`)).status()).toBe(404);
  const anonymous = await browser.newContext();
  const reader = await anonymous.newPage();
  await reader.goto(`/content/app/news/${id}`);
  await expect(reader.getByRole("heading", { level: 1 })).toHaveText("Notícia pública sintética");
  expect(await reader.locator(".news-prose script").count()).toBe(0);
  await expect(reader.locator(".news-prose")).toContainText("<script>texto seguro</script>");
  await reader.setViewportSize({ width: 390, height: 844 });
  expect(
    (
      await new AxeBuilder({ page: reader })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await reader.screenshot({ path: testInfo.outputPath("news-public-mobile.png"), fullPage: true });
  await anonymous.close();
  await page.getByLabel("Título", { exact: true }).fill("Edição privada posterior");
  await expect(page.getByRole("button", { name: "Publicar agora", exact: true })).toBeEnabled();
  await expectNoNewsReasonFields(page);
  const withdraw = page.getByRole("button", {
    name: "Retirar publicação e salvar rascunho",
    exact: true,
  });
  await expect(withdraw).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar rascunho", exact: true })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("news-withdraw-draft-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(withdraw).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("news-withdraw-draft-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route(`**/api/v1/news/${id}`, async (route) => {
    if (route.request().method() === "PUT") await route.fulfill({ status: 500, body: "{}" });
    else await route.continue();
  });
  await withdraw.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Não foi possível concluir" }),
  ).toBeVisible();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Edição privada posterior");
  expect((await (await request.get(`/api/v1/content/app/news/${id}`)).json()).title).toBe(
    "Notícia pública sintética",
  );
  await page.unroute(`**/api/v1/news/${id}`);
  await withdraw.click();
  await expect(
    page.getByRole("status").filter({ hasText: "Publicação retirada. Rascunho salvo. Revisão 3." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar rascunho", exact: true })).toBeEnabled();
  expect((await request.get(`/api/v1/content/app/news/${id}`)).status()).toBe(404);
  expect(
    (
      await (
        await page.request.get(
          `/api/v1/news?collection=published&search=Edição%20privada%20posterior`,
        )
      ).json()
    ).items,
  ).toEqual([]);
  await page.goto("/news/drafts?search=Edição%20privada%20posterior");
  await expect(page.locator(`a[href="/news/${id}"]`)).toContainText("Edição privada posterior");
  await page.goto("/");
  await expect(page.locator(`a[href$="/news/${id}"]`)).toHaveCount(0);
  await page.goto(`/news/${id}`);
  const future = new Date(Date.now() + 10 * 60000 - 3 * 3600000).toISOString().slice(0, 16);
  await page.getByLabel("Data e horário de Brasília", { exact: true }).fill(future);
  await page.getByRole("button", { name: "Agendar", exact: true }).click();
  await confirm(page);
  await expect(page.getByRole("button", { name: "Cancelar agendamento" })).toBeVisible();
  await expectNoNewsReasonFields(page);
  await page.getByRole("button", { name: "Cancelar agendamento" }).click();
  await expect(page.getByText("Agendamento cancelado.", { exact: true })).toBeVisible();
  await destinations.getByLabel("Site", { exact: true }).check();
  await expectNoNewsReasonFields(page);
  await page.getByRole("button", { name: "Publicar agora", exact: true }).click();
  await confirm(page);
  expect((await request.get(`/api/v1/content/site/news/${id}`)).status()).toBe(200);
  await destinations.getByLabel("Site", { exact: true }).uncheck();
  await expectNoNewsReasonFields(page);
  await page.getByRole("button", { name: "Retirar publicação", exact: true }).click();
  await confirm(page);
  expect((await request.get(`/api/v1/content/app/news/${id}`)).status()).toBe(404);
  expect((await request.get(`/api/v1/content/site/news/${id}`)).status()).toBe(200);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("news-publication-agenda.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Arquivar", exact: true }).click();
  await confirm(page);
  expect((await request.get(`/api/v1/content/site/news/${id}`)).status()).toBe(404);
  expect((await request.get(`/api/v1/news/${id}/publication`)).status()).toBe(401);
});
