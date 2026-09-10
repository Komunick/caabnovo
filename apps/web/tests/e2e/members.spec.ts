import { createHmac, randomUUID } from "node:crypto";
import { Client } from "pg";
import { symmetricDecrypt } from "better-auth/crypto";
import type { Page } from "@playwright/test";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";

// Only the synthetic fixture's secret is read, to complete its real MFA challenge.
async function administratorCode() {
  const db = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await db.connect();
  try {
    const result = await db.query<{ secret: string }>(
      `SELECT t.secret FROM two_factor t JOIN "user" u ON u.id=t.user_id WHERE u.email=$1`,
      [syntheticUsers.administrator.email],
    );
    const secret = await symmetricDecrypt({
      key: process.env.BETTER_AUTH_SECRET!,
      data: result.rows[0]!.secret,
    });
    const bytes = Buffer.from(secret);
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const digest = createHmac("sha1", bytes).update(counter).digest();
    return ((digest.readUInt32BE(digest[digest.length - 1]! & 15) & 0x7fffffff) % 1000000)
      .toString()
      .padStart(6, "0");
  } finally {
    await db.end();
  }
}
async function signIn(page: Page, administrator = true) {
  const user = administrator ? syntheticUsers.administrator : syntheticUsers.ordinary;
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  if (administrator) {
    await expect(page).toHaveURL(/\/mfa$/);
    await page.getByLabel("Código de verificação").fill(await administratorCode());
    await page.getByRole("button", { name: "Verificar" }).click();
  }
  await expect(page).toHaveURL(/\/$/);
}
async function create(page: Page, name: string) {
  await page.goto("/members/new");
  await page.getByLabel("Nome completo").fill(name);
  await page.getByLabel("Motivo do cadastro ou alteração").fill("Cadastro sintético de teste");
  await page.getByRole("button", { name: "Criar cadastro" }).click();
  await expect(page).toHaveURL(/\/members\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  return page.url();
}

test("administrator manages people, relationships, independent assessments and archive by keyboard at 390px", async ({
  page,
}, testInfo) => {
  await signIn(page);
  const suffix = randomUUID().slice(0, 8);
  const dependent = `Dependente ${suffix}`;
  await create(page, dependent);
  const name = `Associado ${suffix}`;
  const holderUrl = await create(page, name);
  await expectWcag22AA(page);
  await page.getByRole("button", { name: "Dependentes", exact: true }).click();
  await page.getByLabel("Buscar pessoa pelo nome").fill(dependent);
  await page.getByRole("button", { name: "Buscar pessoa", exact: true }).click();
  await expect(page.getByLabel("Pessoa encontrada")).toBeVisible();
  await page.getByLabel("Relação declarada").fill("Vínculo sintético");
  await page.getByLabel("Justificativa do vínculo").fill("Documento de teste");
  await page.getByRole("button", { name: "Vincular dependente" }).click();
  await expect(page.getByRole("link", { name: dependent, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Situações", exact: true }).click();
  await page.getByLabel("Resultado", { exact: true }).selectOption("approved");
  await page.getByLabel("Data da conferência").fill("2020-01-01");
  await page.getByLabel("Fonte ou regra aplicada").fill("Regra sintética");
  await page.getByLabel("Motivo da decisão").fill("Avaliação sintética");
  await page.getByRole("button", { name: "Registrar avaliação", exact: true }).click();
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
  await page.setViewportSize({ width: 390, height: 844 });
  await expectWcag22AA(page);
  await page.getByRole("button", { name: "Cadastro", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Nome completo").fill(`${name} corrigido`);
  await page
    .getByLabel("Motivo do cadastro ou alteração")
    .fill("Correção de identificação sintética");
  await page.getByRole("button", { name: "Salvar cadastro" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: `${name} corrigido`, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Situações", exact: true }).click();
  await expect(
    page.getByText("Identificação alterada após esta avaliação. Revise a decisão."),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("associados-mobile.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Cadastro", exact: true }).click();
  await page.getByLabel("Motivo do arquivamento ou restauração").fill("Arquivamento sintético");
  await page.getByRole("button", { name: "Arquivar cadastro", exact: true }).click();
  await expect(page.getByRole("button", { name: "Restaurar cadastro" })).toBeVisible();
  await page.getByRole("button", { name: "Restaurar cadastro" }).click();
  await expect(page.getByRole("button", { name: "Arquivar cadastro", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Histórico", exact: true }).click();
  await expect(page.getByText("Cadastro restaurado", { exact: true })).toBeVisible();
  await expectWcag22AA(page);
  await page.goto(holderUrl);
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
