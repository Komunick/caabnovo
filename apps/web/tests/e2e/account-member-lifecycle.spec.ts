import { Client } from "pg";
import type { Page } from "@playwright/test";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";

test.setTimeout(120_000);

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}
async function create(page: Page, path: string, data: unknown) {
  const response = await page.request.post(path, {
    data,
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    },
  });
  expect(response.status()).toBe(201);
  return response.json();
}
async function expire(table: "user" | "member", id: string) {
  const db = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await db.connect();
  try {
    await db.query(
      `UPDATE "${table}" SET deletion_effective_at=clock_timestamp()-interval '1 second' WHERE id=$1`,
      [id],
    );
  } finally {
    await db.end();
  }
}
test("administrator reactivates, replaces password, schedules deletion and restores a colleague", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  const email = `lifecycle-${crypto.randomUUID()}@example.test`;
  const user = await create(page, "/api/v1/users", {
    name: "Colaborador ciclo de vida",
    email,
    roleIds: [],
  });
  await page.goto(`/users/${user.id}`);
  await page.getByRole("button", { name: "Desativar colaborador", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar desativação", exact: true }).click();
  await expect(page.getByText("Desativado", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reativar colaborador", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar reativação", exact: true }).click();
  await expect(page.getByText("Ativo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Gerar nova senha", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar nova senha", exact: true }).click();
  const receipt = page.getByRole("region", { name: "Nova senha do colaborador" });
  await expect(receipt).toBeVisible();
  const password = await receipt.getByLabel("Nova senha", { exact: true }).inputValue();
  expect(password === user.initialPassword).toBe(false);
  await expect(receipt.getByLabel("Nova senha", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await expectWcag22AA(page);
  const context = await page
    .context()
    .browser()!
    .newContext({ baseURL: new URL(page.url()).origin });
  try {
    const origin = new URL(page.url()).origin;
    const previous = await context.request.post("/api/auth/sign-in/email", {
      data: { email, password: user.initialPassword },
      headers: { origin },
    });
    expect(previous.status()).toBe(401);
    const current = await context.request.post("/api/auth/sign-in/email", {
      data: { email, password },
      headers: { origin },
    });
    expect(current.status()).toBe(200);
    await receipt.getByRole("link", { name: "Abrir colaborador" }).click();
    await expect(page.getByLabel("Nova senha", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Excluir colaborador", exact: true }).click();
    await page.getByRole("button", { name: "Confirmar exclusão", exact: true }).click();
    await expect(
      page.getByText("Exclusão em 24 horas — conta bloqueada", { exact: true }),
    ).toBeVisible();
    expect((await context.request.get("/api/v1/me")).status()).toBe(401);
  } finally {
    await context.close();
  }
  await expire("user", user.id);
  await page.goto("/users?deleted=only");
  await page.getByRole("link", { name: user.name, exact: true }).click();
  await expect(page.getByText("Excluído", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restaurar colaborador", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar restauração", exact: true }).click();
  await expect(page.getByText("Ativo", { exact: true })).toBeVisible();
});

test("member deletion waits seven days and offers undo and restoration with retained history", async ({
  page,
}) => {
  await login(page);
  const member = await create(page, "/api/v1/members", {
    profile: { name: `Associado ciclo ${crypto.randomUUID().slice(0, 8)}` },
  });
  await page.goto(`/members/${member.id}`);
  await page.getByRole("button", { name: "Excluir associado", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão", exact: true }).click();
  await expect(page.getByText(/Exclusão prevista para/)).toBeVisible();
  await page.getByRole("button", { name: "Desfazer exclusão do associado", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar restauração", exact: true }).click();
  await expect(page.getByText(/Exclusão prevista para/)).toHaveCount(0);
  await page.getByRole("button", { name: "Excluir associado", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão", exact: true }).click();
  await expect(page.getByText(/Exclusão prevista para/)).toBeVisible();
  await expire("member", member.id);
  await page.reload();
  await expect(page.getByText(/Associado excluído\. Vínculos e histórico/)).toBeVisible();
  await page.getByRole("button", { name: "Restaurar associado excluído", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar restauração", exact: true }).click();
  await page.getByRole("button", { name: "Histórico", exact: true }).click();
  await expect(page.getByText("Exclusão solicitada (sete dias)").first()).toBeVisible();
});
