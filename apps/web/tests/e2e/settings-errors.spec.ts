import { randomUUID } from "node:crypto";
import { expect, test, syntheticUsers } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
import { keyboardActivate } from "./keyboard";
import { provisionAccount } from "./provision-account";

test("reports recovery unavailability and permits a retry by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let fail = true;
  await page.route("**/api/auth/request-password-reset", (route) =>
    route.fulfill({
      status: fail ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(fail ? { code: "RECOVERY_UNAVAILABLE" } : { status: true }),
    }),
  );
  await page.goto("/forgot-password");
  await page.getByLabel("E-mail da conta").focus();
  await page.keyboard.type("synthetic@example.test");
  await keyboardActivate(page, page.getByRole("button", { name: "Enviar link de recuperação" }));
  await expect(page.getByRole("alert").filter({ hasText: "indisponível" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Se houver" })).toHaveCount(0);
  await expectWcag22AA(page);
  fail = false;
  await keyboardActivate(page, page.getByRole("button", { name: "Enviar link de recuperação" }));
  await expect(page.getByRole("status").filter({ hasText: "Se houver" })).toBeVisible();
});

test("shows grant refusal reasons and grants administrator without MFA", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(90000);
  const user = await provisionAccount({
    email: `grant-${randomUUID()}@example.test`,
    name: "Destinatário Sintético",
    password: "SyntheticGrantPassword2026",
  });
  const login = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: baseURL! },
    data: syntheticUsers.administrator,
  });
  expect(login.ok()).toBe(true);
  await page.goto(`/users/${user.id}`);
  await page.getByRole("radio", { name: "Administrador", exact: true }).check();
  await expect(page.getByLabel("Justificativa da função")).toHaveCount(0);
  const errors = [
    ["ROLE_GRANT_DENIED", "Você não tem permissão"],
    ["GRANT_BEYOND_AUTHORITY", "você não pode conceder"],
    ["SELF_ESCALATION_DENIED", "própria conta"],
    ["ROLE_ALREADY_ASSIGNED", "já possui"],
    ["USER_ROLE_CONFLICT", "revogue o cargo atual"],
    ["USER_NOT_FOUND", "desativado"],
    ["AUTHENTICATION_REQUIRED", "sessão expirou"],
  ];
  let errorCode = "";
  const routePattern = "**/api/v1/users/*/roles/*";
  await page.route(routePattern, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ code: errorCode }),
    }),
  );
  for (const [code, message] of errors) {
    errorCode = code!;
    await page.getByRole("button", { name: "Conceder função", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: message })).toBeVisible();
  }
  await page.unroute(routePattern);
  await page.getByRole("button", { name: "Conceder função", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Revogar Administrador", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/MFA|autenticador/)).toHaveCount(0);
});
