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

test("text, date and OAB fields give consistent feedback across modules", async ({
  page,
}, testInfo) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30000 });
  await page.goto("/members/new");
  const name = page.locator("#member-name");
  await name.fill(" ");
  await name.press("Tab");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#member-name-error")).toHaveText("Preencha este campo.");
  await name.fill("A");
  await name.press("Tab");
  await expect(page.locator("#member-name-error")).toHaveText("Use pelo menos 2 caracteres.");
  await name.fill("Pessoa sintética");
  await name.press("Tab");
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  const oab = page.locator("#member-oab-number");
  await oab.fill("12a345");
  await expect(oab).toHaveValue("12345");
  await oab.evaluate((input) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", "ab001234789");
    (input as HTMLInputElement).select();
    input.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }),
    );
  });
  await expect(oab).toHaveValue("001234");
  const birth = page.locator("#member-birth");
  await birth.fill("2999-01-01");
  await page.locator("#member-email").focus();
  await expect(birth).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Abrir calendário de nascimento" }).click();
  await page.getByRole("button", { name: "Limpar data", exact: true }).click();
  await expect(birth).not.toHaveAttribute("aria-invalid", "true");
  await birth.fill("2000-01-01");
  await page.locator("#member-email").focus();
  await expect(birth).not.toHaveAttribute("aria-invalid", "true");
  await expectWcag22AA(page);
  await page.goto("/users");
  await page.locator("#create-name").fill(" ");
  await page.locator("#create-name").press("Tab");
  await expect(page.locator("#create-name-error")).toHaveText("Preencha este campo.");
  await page.goto("/settings");
  await page.locator("#settings-name").fill(" ");
  await page.locator("#settings-name").press("Tab");
  await expect(page.locator("#settings-name-error")).toHaveText("Preencha este campo.");
  await page.goto("/news/new");
  await page.getByText("Quer personalizar o endereço?", { exact: true }).click();
  await page.locator("#news-slug").fill("Texto com espaços");
  await page.locator("#news-slug").press("Tab");
  await expect(page.locator("#news-slug")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#news-slug").fill("texto-valido");
  await page.locator("#news-slug").press("Tab");
  await expect(page.locator("#news-slug")).not.toHaveAttribute("aria-invalid", "true");
  await expectWcag22AA(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({
    path: testInfo.outputPath("common-fields-news-390.png"),
    fullPage: true,
  });
});
