import { keyboardActivate, keyboardType, tabTo } from "./keyboard";
import { randomUUID } from "node:crypto";
import { expect, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";

test("edits own name, changes password, confirms email and signs out through the account menu", async ({
  page,
  baseURL,
  playwright,
}, testInfo) => {
  test.setTimeout(90_000);
  const email = `settings-${randomUUID()}@example.test`;
  const newEmail = `changed-${email}`;
  const password = "Synthetic-Settings-Only-Password-2026!";
  const newPassword = "Synthetic-Settings-New-Password-2026!";
  const signup = await page.request.post("/api/auth/sign-up/email", {
    headers: { origin: baseURL! },
    data: { email, password, name: "Conta Sintética" },
  });
  expect(signup.ok()).toBe(true);
  const other = await playwright.request.newContext({ baseURL });
  const mailbox = await playwright.request.newContext();
  try {
    expect(
      (
        await other.post("/api/auth/sign-in/email", {
          headers: { origin: baseURL! },
          data: { email, password },
        })
      ).ok(),
    ).toBe(true);
    await page.goto("/");
    await expect(
      page
        .getByRole("navigation", { name: "Navegação administrativa" })
        .getByRole("button", { name: "Sair", exact: true }),
    ).toHaveCount(0);
    const menu = page.getByRole("button", { name: "Menu da conta de Conta Sintética" });
    await tabTo(page, menu);
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("link", { name: "Configurações da conta", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await keyboardActivate(page, menu);
    await keyboardActivate(
      page,
      page.getByRole("link", { name: "Configurações da conta", exact: true }),
    );
    await expectWcag22AA(page);
    await expect(page.locator(".sidebar-profile__avatar")).toHaveCount(0);
    await expect(page.getByText(/12 a 128|12 a 72/)).toHaveCount(0);
    await expect(page.getByLabel("Nova senha", { exact: true })).toHaveAttribute("maxlength", "72");
    await keyboardActivate(page, page.getByRole("button", { name: "Recolher menu lateral" }));
    await expect(page.locator(".account-menu-collapsed-label")).toBeVisible();
    const accountButton = page.locator(".account-menu-trigger");
    await expect
      .poll(async () => {
        const box = await accountButton.boundingBox();
        return page.viewportSize()!.height - (box!.y + box!.height);
      })
      .toBeLessThan(30);
    await keyboardActivate(page, menu);
    await expect(
      page.getByRole("link", { name: "Configurações da conta", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await keyboardActivate(page, page.getByRole("button", { name: "Expandir menu lateral" }));
    await page.setViewportSize({ width: 390, height: 844 });
    const forged = await page.request.post("/api/v1/me/settings", {
      headers: { origin: baseURL!, "x-csrf-token": randomUUID() },
      data: { action: "profile", name: "Forged", version: 1, userId: randomUUID() },
    });
    expect(forged.status()).toBe(422);
    await keyboardType(
      page,
      page.getByLabel("Novo e-mail", { exact: true }),
      "preservar@example.test",
    );
    await keyboardType(page, page.getByLabel("Nome", { exact: true }), "   ");
    await keyboardActivate(page, page.getByRole("button", { name: "Salvar nome", exact: true }));
    await expect(
      page.getByRole("alert").filter({ hasText: "Informe um nome válido" }),
    ).toBeVisible();
    await expect(page.getByLabel("Novo e-mail", { exact: true })).toHaveValue(
      "preservar@example.test",
    );
    await keyboardType(page, page.getByLabel("Nome", { exact: true }), "Perfil Atualizado");
    await keyboardActivate(page, page.getByRole("button", { name: "Salvar nome", exact: true }));
    await expect(page.getByRole("status").filter({ hasText: "Nome atualizado" })).toContainText(
      "Nome atualizado",
    );
    await expect(
      page.getByRole("button", { name: "Menu da conta de Perfil Atualizado" }),
    ).toBeVisible();
    await keyboardType(page, page.getByLabel("Senha atual para trocar senha"), password);
    await keyboardType(page, page.getByLabel("Nova senha", { exact: true }), newPassword);
    await keyboardType(page, page.getByLabel("Confirmar nova senha"), password);
    await keyboardActivate(page, page.getByRole("button", { name: "Alterar senha", exact: true }));
    await expect(page.getByRole("alert").filter({ hasText: "não coincide" })).toContainText(
      "não coincide",
    );
    await keyboardType(page, page.getByLabel("Confirmar nova senha"), newPassword);
    await keyboardActivate(page, page.getByRole("button", { name: "Alterar senha", exact: true }));
    await expect(page.getByRole("status").filter({ hasText: "Senha alterada" })).toContainText(
      "Senha alterada",
    );
    expect((await other.get("/api/v1/me")).status()).toBe(401);
    expect(
      (
        await other.post("/api/auth/sign-in/email", {
          headers: { origin: baseURL! },
          data: { email, password },
        })
      ).status(),
    ).toBe(401);
    await keyboardType(page, page.getByLabel("Novo e-mail", { exact: true }), newEmail);
    await keyboardType(page, page.getByLabel("Senha atual para trocar e-mail"), newPassword);
    await keyboardActivate(
      page,
      page.getByRole("button", { name: "Enviar confirmação", exact: true }),
    );
    await expect(page.getByRole("status").filter({ hasText: "Confirmação enviada" })).toContainText(
      "Confirmação enviada",
    );
    expect((await (await page.request.get("/api/v1/me")).json()).email).toBe(email);
    const mailboxURL = process.env.MAILPIT_URL ?? "http://localhost:8025";
    let messageId = "";
    await expect
      .poll(async () => {
        const result = await mailbox.get(
          `${mailboxURL}/api/v1/search?query=${encodeURIComponent(`to:${newEmail}`)}`,
        );
        const body = await result.json();
        messageId = body.messages?.[0]?.ID ?? "";
        return Boolean(messageId);
      })
      .toBe(true);
    const message = await (await mailbox.get(`${mailboxURL}/api/v1/message/${messageId}`)).json();
    const confirmation = String(message.Text).match(
      /https?:\/\/\S+\/confirm-email#token=[a-f0-9]{64}/,
    )?.[0];
    expect(confirmation).toBeTruthy();
    await page.goto(confirmation!);
    await keyboardActivate(page, page.getByRole("button", { name: "Confirmar troca de e-mail" }));
    await expect(
      page.getByRole("status").filter({ hasText: "E-mail alterado com sucesso" }),
    ).toContainText("E-mail alterado com sucesso");
    await keyboardActivate(page, page.getByRole("link", { name: "Voltar às configurações" }));
    await expect(page.getByText(`E-mail atual: ${newEmail}`, { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expectWcag22AA(page);
    await page.screenshot({
      path: testInfo.outputPath("configuracoes-mobile.png"),
      fullPage: true,
    });
    await keyboardActivate(page, page.getByRole("button", { name: "Abrir menu de navegação" }));
    await keyboardActivate(
      page,
      page.getByRole("button", { name: "Menu da conta de Perfil Atualizado" }),
    );
    await expectWcag22AA(page);
    await page.screenshot({ path: testInfo.outputPath("menu-conta-mobile.png") });
    await keyboardActivate(page, page.getByRole("button", { name: "Sair", exact: true }));
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("img", { name: "CAAB", exact: true }).last()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("login-logo-mobile.png") });
    await keyboardType(page, page.getByLabel("E-mail"), newEmail);
    await keyboardType(page, page.getByLabel("Senha", { exact: true }), newPassword);
    await keyboardActivate(page, page.getByRole("button", { name: "Entrar", exact: true }));
    await expect(page).toHaveURL(/\/$/);
  } finally {
    await other.dispose();
    await mailbox.dispose();
  }
});
