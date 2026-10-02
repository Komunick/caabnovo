import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { test, expect, syntheticUsers } from "./fixtures";
import { syntheticUserContact } from "../helpers/user-contact";
import { expectWcag22AA } from "./accessibility";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

for (const roleCode of ["manager", "collaborator"] as const) {
  test(`${roleCode} sees message creation only while write permission is granted`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await login(page, syntheticUsers.administrator.email, syntheticUsers.administrator.password);
    const origin = new URL(page.url()).origin;
    const headers = () => ({
      origin,
      "x-csrf-token": randomUUID(),
      "idempotency-key": randomUUID(),
    });
    const rolesResponse = await page.request.get("/api/v1/roles");
    expect(rolesResponse.status()).toBe(200);
    const roles: { id: string; code: string }[] = await rolesResponse.json();
    const role = roles.find(({ code }) => code === roleCode)!;
    expect(role).toBeDefined();
    const created = await page.request.post("/api/v1/users", {
      headers: headers(),
      data: {
        ...syntheticUserContact(),
        name: `Consulta de Mensagens ${roleCode}`,
        email: `messages-access-${randomUUID()}@example.test`,
        roleIds: [role.id],
      },
    });
    expect(created.status()).toBe(201);
    const user: { id: string; email: string; initialPassword: string } = await created.json();
    const context = await page.context().browser()!.newContext({ baseURL: origin });
    const view = await context.newPage();
    try {
      await login(view, user.email, user.initialPassword);
      const meResponse = await view.request.get("/api/v1/me");
      expect(meResponse.status()).toBe(200);
      const me: { permissions: string[]; roles: { code: string }[] } = await meResponse.json();
      expect(me.roles.map(({ code }) => code)).toContain(roleCode);
      let snapshot = { version: 0, permissions: me.permissions };
      async function setAccess(permissions: string[]) {
        const response = await page.request.put(`/api/v1/users/${user.id}/access`, {
          headers: headers(),
          data: {
            version: snapshot.version,
            expectedPermissions: snapshot.permissions,
            permissions,
          },
        });
        expect(response.status()).toBe(200);
        snapshot = await response.json();
      }
      async function createDraft() {
        return view.request.post("/api/v1/messages/campaigns", {
          headers: headers(),
          data: { expectedVersion: 0, data: { name: `Rascunho sintético ${randomUUID()}` } },
        });
      }
      async function consultation() {
        await expect(
          view.getByRole("heading", { name: "Agendamentos", exact: true }),
        ).toBeVisible();
        await expect(view.getByLabel("Buscar campanha", { exact: true })).toBeVisible();
        await expect(view.getByRole("link", { name: "Escolher campanha existente" })).toBeVisible();
        expect((await view.request.get("/api/v1/messages/schedules")).status()).toBe(200);
      }
      async function capture(state: string, width: number, theme: string) {
        await view.setViewportSize({ width, height: 900 });
        await view.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        await view.screenshot({
          path: testInfo.outputPath(`messages-access-${roleCode}-${state}-${width}-${theme}.png`),
          fullPage: true,
          animations: "disabled",
        });
      }
      const creation = view.getByRole("link", { name: "Novo agendamento", exact: true });
      await setAccess(["messages:access"]);
      await view.goto("/messages/schedules");
      await consultation();
      await expect(creation).toHaveCount(0);
      expect((await createDraft()).status()).toBe(403);
      await capture("read", 1280, "light");
      await expectWcag22AA(view);

      await setAccess(["messages:access", "messages:write"]);
      await view.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect(creation).toBeVisible();
      await consultation();
      expect((await createDraft()).status()).toBe(200);
      await capture("write", 390, "dark");
      await expectWcag22AA(view);
      await creation.focus();
      await expect(creation).toBeFocused();
      await view.keyboard.press("Enter");
      await expect(view).toHaveURL(/\/messages\/campaigns\/new$/);
      await view.goto("/messages/schedules");
      await expect(creation).toBeVisible();

      await setAccess(["messages:access"]);
      // The server must refuse the next mutation even before the UI refreshes.
      expect((await createDraft()).status()).toBe(403);
      await view.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expect(creation).toHaveCount(0);
      await consultation();
      await capture("revoked", 320, "light");
    } finally {
      await context.close();
    }
  });
}
