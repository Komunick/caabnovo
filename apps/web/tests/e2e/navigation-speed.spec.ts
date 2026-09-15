import { Client } from "pg";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";

// Locks only the disposable CI database prepared by the E2E workflow.
test.skip(!process.env.CI, "Controlled database delays run only against synthetic CI data.");

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Configurações", exact: true })).toBeVisible();
}

async function holdMembers() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL idle_in_transaction_session_timeout = '60s'");
    await client.query("LOCK TABLE member IN ACCESS EXCLUSIVE MODE");
  } catch (error) {
    await client.end();
    throw error;
  }
  return {
    async waitForBlockedRead() {
      await expect
        .poll(async () => {
          const result = await client.query<{ blocked: boolean }>(
            "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE pg_backend_pid() = ANY(pg_blocking_pids(pid))) AS blocked",
          );
          return result.rows[0]?.blocked;
        })
        .toBe(true);
    },
    async release() {
      try {
        await client.query("ROLLBACK");
      } finally {
        await client.end();
      }
    },
  };
}

test("a slow area shows its loading state and navigation remains interruptible", async ({
  page,
}, testInfo) => {
  await signIn(page);
  const navigation = page.getByRole("navigation", { name: "Navegação administrativa" });
  const lock = await holdMembers();
  try {
    await navigation.getByRole("link", { name: "Associados", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Carregando associados…" }),
    ).toBeVisible();
    await lock.waitForBlockedRead();
    await expect(navigation).toBeVisible();
    await expectWcag22AA(page);
    await page.screenshot({
      path: testInfo.outputPath("navigation-loading-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Ativar tema escuro" }).click();
    await expectWcag22AA(page);
    await page.screenshot({
      path: testInfo.outputPath("navigation-loading-mobile-dark.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Abrir menu de navegação" }).click();
    await navigation.getByRole("link", { name: "Colaboradores", exact: true }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole("heading", { name: "Colaboradores", exact: true })).toBeVisible();
    await expect(page.locator(".admin-shell")).not.toHaveClass(/admin-shell--mobile-open/);
  } finally {
    await lock.release();
  }
});

test("home shortcuts and news render before a blocked member query finishes", async ({
  page,
}, testInfo) => {
  await signIn(page);
  const lock = await holdMembers();
  try {
    // Reload forces a fresh server render instead of reusing the previously visited home.
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.getByRole("heading", { name: /^Bom trabalho,/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Atalhos de trabalho" })).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Carregando cadastros…" }),
    ).toBeVisible();
    await lock.waitForBlockedRead();
    await expect(
      page.getByRole("heading", { name: "Notícias em preparação", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Carregando publicações…" }),
    ).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("navigation-home-independent.png"),
      fullPage: true,
    });
  } finally {
    await lock.release();
  }
  await expect(
    page.getByRole("heading", { name: "Cadastros sem análise", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Carregando cadastros…" })).toHaveCount(
    0,
  );
});

test("an unprefetched link acknowledges a slow response without reloading the shell", async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname === "/users",
    async (route) => {
      const headers = route.request().headers();
      if (headers["next-router-prefetch"]) return route.abort();
      if (headers.rsc === "1") await held;
      await route.continue();
    },
  );
  await signIn(page);
  const navigation = page.getByRole("navigation", { name: "Navegação administrativa" });
  const target = navigation.getByRole("link", { name: "Colaboradores", exact: true });
  try {
    await target.focus();
    await page.keyboard.press("Enter");
    await expect(target.locator("[data-pending]")).toHaveCount(1);
    await expect(target.getByRole("status")).toHaveText("Abrindo página…");
    await page.getByRole("button", { name: "Recolher menu lateral" }).click();
  } finally {
    release();
  }
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("heading", { name: "Colaboradores", exact: true })).toBeVisible();
  await expect(page.locator(".admin-shell")).toHaveClass(/admin-shell--collapsed/);
  await expect(target.locator("[data-pending]")).toHaveCount(0);
});

test("direct settings anchors remain visible after the page streams on mobile", async ({
  page,
}) => {
  await signIn(page);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, name] of [
    ["profile-title", "Perfil"],
    ["email-title", "E-mail de acesso"],
    ["password-title", "Alterar senha"],
  ]) {
    await page.goto("/sessions");
    await page.goto(`/settings#${id}`, { waitUntil: "commit" });
    await expect(page.getByRole("heading", { name, exact: true })).toBeInViewport();
  }
});
