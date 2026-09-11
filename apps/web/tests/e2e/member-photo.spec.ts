import { randomUUID } from "node:crypto";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";

const image = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=",
  "base64",
);

test("member photo uploads privately, persists, replaces and removes at mobile width", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/members/new");
  const name = `Foto sintética ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Nome completo").fill(name);
  await page.getByLabel("Motivo do cadastro ou alteração").fill("Cadastro sintético para foto");
  await page.getByRole("button", { name: "Criar cadastro" }).click();
  await expect(page).toHaveURL(/\/members\/[0-9a-f-]+$/);
  const profileUrl = page.url();
  await page.getByRole("button", { name: "Cadastro", exact: true }).click();
  const photo = page.getByRole("region", { name: "Foto de perfil", exact: true });
  const input = photo.getByLabel("Selecionar foto de perfil");
  await input.setInputFiles({
    name: "invalid.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4"),
  });
  await expect(photo.getByRole("alert")).toHaveText("Escolha uma foto JPEG ou PNG de até 5 MB.");
  await expect(photo.getByRole("button", { name: "Salvar foto", exact: true })).toBeDisabled();
  for (const filename of ["foto-sintetica.png", "foto-substituta.png"]) {
    await input.setInputFiles({ name: filename, mimeType: "image/png", buffer: image });
    await expect(photo.getByText("Prévia · ainda não salva")).toBeVisible();
    await photo.getByLabel("Motivo da alteração da foto").fill("Atualização sintética da foto");
    await photo.getByRole("button", { name: "Salvar foto", exact: true }).click();
    await expect(photo.getByRole("status")).toHaveText("Foto de perfil atualizada.", {
      timeout: 65_000,
    });
    await page.reload();
    await expect(page.locator("h1 img")).toHaveAttribute(
      "src",
      /\/api\/v1\/members\/.+\/files\/.+/,
    );
    await expect
      .poll(() =>
        page
          .locator("h1 img")
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Cadastro", exact: true }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
    await expectWcag22AA(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await photo.getByRole("button", { name: "Trocar foto" }).scrollIntoViewIfNeeded();
  }
  await photo.getByLabel("Motivo da alteração da foto").fill("Remoção sintética da foto");
  await photo.getByRole("button", { name: "Remover foto", exact: true }).click();
  await expect(photo.getByRole("status")).toHaveText("Foto removida.");
  await page.goto(profileUrl);
  await expect(page.locator("h1 img")).toHaveCount(0);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
});

test("new member accepts a photo before creation and retries upload without duplicating the record", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/members/new");
  const name = `Novo com foto ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Nome completo").fill(name);
  await page.getByLabel("Motivo do cadastro ou alteração").fill("Cadastro sintético com foto");
  await page
    .getByLabel("Selecionar foto de perfil")
    .setInputFiles({ name: "foto-inicial.png", mimeType: "image/png", buffer: image });
  await expect(page.getByRole("img", { name: "Prévia da foto de perfil" })).toBeVisible();
  await expectWcag22AA(page);
  let creates = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/v1/members")
      creates++;
  });
  await page.route(
    "**/api/v1/files/upload-intents",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "UNAVAILABLE" } }),
      }),
    { times: 1 },
  );
  await page.getByRole("button", { name: "Criar cadastro" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "O cadastro foi criado, mas a foto não foi salva.",
  );
  await expect(page.getByRole("button", { name: "Criar cadastro" })).toHaveCount(0);
  await page.getByRole("button", { name: "Tentar salvar foto novamente" }).click();
  await expect(page).toHaveURL(/\/members\/[0-9a-f-]+$/, { timeout: 65_000 });
  expect(creates).toBe(1);
  await page.reload();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.locator("h1 img")).toHaveAttribute("src", /\/api\/v1\/members\/.+\/files\/.+/);
});
