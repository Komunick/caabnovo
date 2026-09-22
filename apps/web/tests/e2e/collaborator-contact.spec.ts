import { Client } from "pg";
import type { Page } from "@playwright/test";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
import { syntheticUserContact } from "../helpers/user-contact";
test.setTimeout(120_000);

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}
const headers = (page: Page) => ({
  origin: new URL(page.url()).origin,
  "x-csrf-token": crypto.randomUUID(),
  "idempotency-key": crypto.randomUUID(),
});
async function withDatabase(run: (db: Client) => Promise<void>) {
  const db = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await db.connect();
  try {
    await run(db);
  } finally {
    await db.end();
  }
}

test("optional CEP supports lookup, failures and delayed responses without replacing manual edits", async ({
  page,
}) => {
  await login(page);
  await page.goto("/users/new");
  let calls = 0;
  let release: (() => void) | undefined;
  await page.route("https://viacep.com.br/**", async (route) => {
    calls++;
    const url = route.request().url();
    if (url.includes("11111111")) return route.fulfill({ json: { erro: true } });
    if (url.includes("22222222")) return route.abort();
    // Leave the request pending to exercise the component's five-second timeout.
    if (url.includes("44444444")) return;
    if (url.includes("33333333"))
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    return route.fulfill({
      json: {
        cep: url.includes("33333333") ? "33333-333" : "40000-000",
        logradouro: "Rua da consulta",
        bairro: "Bairro da consulta",
        localidade: "Salvador",
        uf: "BA",
      },
    });
  });
  const cep = page.getByLabel("CEP (opcional)", { exact: true });
  await expect(cep).not.toHaveAttribute("required");
  await cep.fill("123");
  await cep.blur();
  expect(await cep.evaluate((node: HTMLInputElement) => node.validity.valid)).toBe(false);
  expect(calls).toBe(0);
  await cep.fill("40000000");
  await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Rua da consulta");
  await expect(page.getByLabel("Cidade", { exact: true })).toHaveValue("Salvador");
  await cep.fill("11111111");
  await expect(page.getByText(/CEP não encontrado/)).toBeVisible();
  await cep.fill("22222222");
  await expect(page.getByText(/Não foi possível consultar o CEP/)).toBeVisible();
  await cep.fill("44444444");
  await expect(page.getByText("Consultando CEP…", { exact: true })).toBeVisible();
  await expect(page.getByText(/Não foi possível consultar o CEP/)).toBeVisible({ timeout: 8000 });
  await cep.fill("33333333");
  await expect.poll(() => Boolean(release)).toBe(true);
  await page.getByLabel("Rua", { exact: true }).fill("Rua manual preservada");
  release!();
  await expect(page.getByText(/CEP consultado/)).toBeVisible();
  await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Rua manual preservada");
  await cep.fill("");
  const contact = syntheticUserContact();
  await page.getByLabel("Nome", { exact: true }).fill("Cadastro sem CEP");
  await page.getByLabel("CPF", { exact: true }).fill(contact.cpf);
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`no-cep-${crypto.randomUUID()}@example.test`);
  await page.getByLabel("Telefone", { exact: true }).fill(contact.phone);
  await page.getByLabel("Número", { exact: true }).fill("s/n");
  await page.getByRole("button", { name: "Criar colaborador", exact: true }).click();
  await expect(page.getByRole("region", { name: "Senha inicial do colaborador" })).toBeVisible();
});

test("CPF reactivation preserves the prior record and cancellation leaves it excluded", async ({
  page,
}, info) => {
  await login(page);
  const contact = syntheticUserContact();
  const created = await page.request.post("/api/v1/users", {
    headers: headers(page),
    data: {
      ...contact,
      name: "Identidade preservada",
      email: `preserve-${crypto.randomUUID()}@example.test`,
      roleIds: [],
    },
  });
  expect(created.status()).toBe(201);
  const user = await created.json();
  async function readUser() {
    const response = await page.request.get("/api/v1/users", {
      params: { q: user.email, deleted: "all" },
    });
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(user.id);
    return result.items[0];
  }
  await withDatabase(async (db) => {
    const expired = await db.query<{ deletion_effective_at: Date }>(
      `UPDATE "user" SET status='disabled',deactivated_at=now(),deletion_effective_at=date_trunc('milliseconds',clock_timestamp()-interval '1 second'),version=version+1 WHERE id=$1 RETURNING deletion_effective_at`,
      [user.id],
    );
    await db.query(
      `INSERT INTO audit_event(actor_user_id,effective_identity,action,entity_type,entity_id,after,reason,origin,request_id,correlation_id)
      SELECT id,id::text,'user.deletion.requested','user',$1,$2::jsonb,'Encerramento anterior','web',$3,$4 FROM "user" WHERE email=$5`,
      [
        user.id,
        JSON.stringify({
          deletionEffectiveAt: expired.rows[0]!.deletion_effective_at.toISOString(),
        }),
        crypto.randomUUID(),
        crypto.randomUUID(),
        syntheticUsers.administrator.email,
      ],
    );
  });
  await page.goto("/users/new");
  await page.getByLabel("Nome", { exact: true }).fill("Tentativa não aplicada");
  await page.getByLabel("CPF", { exact: true }).fill(contact.cpf);
  await expect(
    page.getByText("Motivo da exclusão: Encerramento anterior", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reativar colaborador existente", exact: true }).click();
  await expectWcag22AA(page);
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  expect((await readUser()).status).toBe("disabled");
  await page.getByRole("button", { name: "Reativar colaborador existente", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar reativação", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/users/${user.id}$`));
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue(user.name);
  await expect(page.getByLabel("Rua", { exact: true })).toHaveValue(contact.address.street);
  await expect(page.getByRole("button", { name: "Excluir colaborador", exact: true })).toHaveCount(
    0,
  );
  const saved = await readUser();
  expect(saved).toMatchObject({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    status: "active",
  });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      await expectWcag22AA(page);
      await page.screenshot({
        path: info.outputPath(`collaborator-actions-${theme}-${width}.png`),
        fullPage: true,
      });
    }
  }
});

test("legacy accounts accept gradual address completion and retain unsaved fields between modules", async ({
  page,
}) => {
  await login(page);
  let id = "";
  await withDatabase(async (db) => {
    const result = await db.query<{ id: string }>(
      `INSERT INTO "user"(name,email) VALUES('Cadastro legado',$1) RETURNING id`,
      [`legacy-${crypto.randomUUID()}@example.test`],
    );
    id = result.rows[0]!.id;
  });
  await page.goto(`/users/${id}`);
  await page.getByLabel("Rua (opcional)", { exact: true }).fill("Rua gradual");
  await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Alterações salvas." })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Rua", { exact: true })).toHaveValue("Rua gradual");
  await expect(page.getByLabel("CPF", { exact: true })).toHaveValue("");
  await page.getByLabel("Cidade (opcional)", { exact: true }).fill("Salvador");
  await page
    .getByRole("navigation", { name: "Navegação administrativa" })
    .getByRole("link", { name: "Início", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/users/${id}$`));
  await expect(page.getByLabel("Cidade (opcional)", { exact: true })).toHaveValue("Salvador");
  await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Alterações salvas." })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Cidade", { exact: true })).toHaveValue("Salvador");
});
