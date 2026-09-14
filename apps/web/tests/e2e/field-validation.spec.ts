import { test, expect, syntheticUsers } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
test("common e-mail feedback protects login, recovery, collaborators and settings", async ({
  page,
}) => {
  await page.goto("/login");
  const email = page.getByLabel("E-mail", { exact: true });
  await email.fill("email-invalido");
  await email.press("Tab");
  await expect(
    page.getByText("Informe um e-mail válido, como nome@exemplo.com.", { exact: true }),
  ).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await page.goto("/forgot-password");
  await page.getByLabel("E-mail da conta").fill("nome@invalido");
  await page.getByLabel("E-mail da conta").press("Tab");
  await expect(
    page.getByText("Informe um e-mail válido, como nome@exemplo.com.", { exact: true }),
  ).toBeVisible();
  await page.goto("/login");
  await email.fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30000 });
  await page.goto("/users");
  const createEmail = page.locator("#create-email");
  await createEmail.fill("nome@invalido");
  await createEmail.press("Tab");
  await expect(createEmail).toHaveAttribute("aria-invalid", "true");
  await createEmail.fill("valid@example.test");
  await createEmail.press("Tab");
  await expect(createEmail).not.toHaveAttribute("aria-invalid", "true");
  await page.goto("/settings");
  await page.getByLabel("Novo e-mail", { exact: true }).fill("invalido");
  await page.getByLabel("Novo e-mail", { exact: true }).press("Tab");
  await expect(page.getByLabel("Novo e-mail", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expectWcag22AA(page);
});
test("member contact fields share masks and validation for fixed and mobile phones", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30000 });
  await page.goto("/members/new");
  const phone = page.getByLabel("Telefone (opcional)", { exact: true });
  await phone.fill("7133334444");
  await expect(phone).toHaveValue("(71) 3333-4444");
  await phone.fill("71999998888");
  await expect(phone).toHaveValue("(71) 99999-8888");
  await phone.fill("713");
  await phone.press("Tab");
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await phone.fill("7133334444");
  await phone.press("Tab");
  await expect(phone).not.toHaveAttribute("aria-invalid", "true");
  const cpf = page.getByLabel("CPF (opcional)", { exact: true });
  await cpf.fill("11111111111");
  await cpf.press("Tab");
  await expect(cpf).toHaveAttribute("aria-invalid", "true");
  await cpf.fill("52998224725");
  await cpf.press("Tab");
  await expect(cpf).toHaveValue("529.982.247-25");
  await expect(cpf).not.toHaveAttribute("aria-invalid", "true");
  await expectWcag22AA(page);
});
