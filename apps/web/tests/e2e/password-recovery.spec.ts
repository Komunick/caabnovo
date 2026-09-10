import { keyboardActivate, keyboardType } from "./keyboard";
import { randomUUID } from "node:crypto";
import { expect, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";

test("recovers a password through local email and rejects reuse of the link", async ({
  page,
  baseURL,
  playwright,
}) => {
  test.setTimeout(90_000);
  const email = `recovery-${randomUUID()}@example.test`;
  const password = "SyntheticRecoveryPassword2026";
  const newPassword = "NewRecoveryPassword2026";
  expect(
    (
      await page.request.post("/api/auth/sign-up/email", {
        headers: { origin: baseURL! },
        data: { email, password, name: "Recuperação Sintética" },
      })
    ).ok(),
  ).toBe(true);
  const mailbox = await playwright.request.newContext();
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/forgot-password");
    await keyboardType(page, page.getByLabel("E-mail da conta"), email);
    await keyboardActivate(page, page.getByRole("button", { name: "Enviar link de recuperação" }));
    await expect(page.getByRole("status").filter({ hasText: "Se houver uma conta" })).toBeVisible();
    const mailboxURL = process.env.MAILPIT_URL ?? "http://localhost:8025";
    let messageId = "";
    await expect
      .poll(async () => {
        const body = await (
          await mailbox.get(
            `${mailboxURL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
          )
        ).json();
        messageId = body.messages?.[0]?.ID ?? "";
        return Boolean(messageId);
      })
      .toBe(true);
    const message = await (await mailbox.get(`${mailboxURL}/api/v1/message/${messageId}`)).json();
    const link = String(message.Text).match(/https?:\/\/\S+\/reset-password#token=\S+/)?.[0];
    expect(link).toBeTruthy();
    await page.goto(link!);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByLabel("Nova senha", { exact: true })).toHaveAttribute("maxlength", "72");
    await expectWcag22AA(page);
    await keyboardType(page, page.getByLabel("Nova senha", { exact: true }), "weakpassword2026");
    await keyboardType(page, page.getByLabel("Confirmar nova senha"), "weakpassword2026");
    await keyboardActivate(
      page,
      page.getByRole("button", { name: "Redefinir senha", exact: true }),
    );
    await expect(page.getByRole("alert").filter({ hasText: "mais forte" })).toBeVisible();
    await keyboardType(page, page.getByLabel("Nova senha", { exact: true }), newPassword);
    await keyboardType(page, page.getByLabel("Confirmar nova senha"), newPassword);
    await keyboardActivate(
      page,
      page.getByRole("button", { name: "Redefinir senha", exact: true }),
    );
    await expect(page.getByRole("status").filter({ hasText: "Senha redefinida" })).toBeVisible();
    expect((await page.request.get("/api/v1/me")).status()).toBe(401);
    await page.goto("/login");
    await page.goto(link!);
    await keyboardType(page, page.getByLabel("Nova senha", { exact: true }), newPassword);
    await keyboardType(page, page.getByLabel("Confirmar nova senha"), newPassword);
    await keyboardActivate(
      page,
      page.getByRole("button", { name: "Redefinir senha", exact: true }),
    );
    await expect(page.getByRole("alert").filter({ hasText: "já foi usado" })).toBeVisible();
    await keyboardActivate(page, page.getByRole("link", { name: "Voltar ao login" }));
    await expect(page.getByRole("link", { name: "Esqueci minha senha" })).toBeVisible();
    await keyboardType(page, page.getByLabel("E-mail"), email);
    await keyboardType(page, page.getByLabel("Senha", { exact: true }), newPassword);
    await keyboardActivate(page, page.getByRole("button", { name: "Entrar", exact: true }));
    await expect(page).toHaveURL(/\/$/);
  } finally {
    await mailbox.dispose();
  }
});
