import { Client } from "pg";
import { expect, syntheticUsers, test } from "./fixtures";

test("scheduling grants guard home, navigation, quick search, pages and direct requests", async ({
  page,
}) => {
  test.setTimeout(120000);
  const db = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await db.connect();
  const userId = (
    await db.query('SELECT id FROM "user" WHERE email=$1', [syntheticUsers.ordinary.email])
  ).rows[0].id;
  const before = (await db.query("SELECT permissions FROM user_access WHERE user_id=$1", [userId]))
    .rows[0].permissions;
  try {
    await db.query("UPDATE user_access SET permissions=ARRAY[]::text[] WHERE user_id=$1", [userId]);
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
    await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.ordinary.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    for (const grants of [
      [],
      ["scheduling:read"],
      ["scheduling:write"],
      ["scheduling:read", "scheduling:write"],
    ]) {
      await db.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [userId, grants]);
      await page.goto("/");
      const read = grants.includes("scheduling:read"),
        write = read && grants.includes("scheduling:write");
      if (read) await expect(page.locator('a[href="/scheduling"]').first()).toBeVisible();
      else await expect(page.locator('a[href^="/scheduling"]')).toHaveCount(0);
      await page.keyboard.press("Control+k");
      const search = page.getByRole("dialog", { name: "Navegação rápida" });
      await search.getByLabel("Buscar funções e áreas").fill("Agendamentos");
      if (read) await expect(search.locator('a[href^="/scheduling"]').first()).toBeVisible();
      else await expect(search.locator('a[href^="/scheduling"]')).toHaveCount(0);
      await page.keyboard.press("Escape");
      expect((await page.request.get("/api/v1/scheduling/units")).status()).toBe(read ? 200 : 403);
      const response = await page.request.post("/api/v1/scheduling/units", {
        headers: {
          origin: new URL(page.url()).origin,
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": crypto.randomUUID(),
        },
        data: { name: "Unidade de acesso sintética" },
      });
      expect(response.status()).toBe(write ? 201 : 403);
      await page.goto("/scheduling");
      if (read) {
        await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toBeVisible();
        await expect(page.getByRole("link", { name: "Nova reserva", exact: true })).toHaveCount(
          write ? 1 : 0,
        );
      } else
        await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toHaveCount(0);
    }
    // The page is open with both grants; a subsequent mutation must use the current DB grants.
    await db.query("UPDATE user_access SET permissions=ARRAY[]::text[] WHERE user_id=$1", [userId]);
    expect((await page.request.get("/api/v1/scheduling/units")).status()).toBe(403);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toHaveCount(0);
    await page.goto("/");
    await expect(page.locator('a[href^="/scheduling"]')).toHaveCount(0);
  } finally {
    await db.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [userId, before]);
    await db.end();
  }
});
