import { test, expect, syntheticUsers } from "./fixtures";

test("blocks signup, protects HTML with nonces and keeps authenticated navigation working", async ({
  page,
  baseURL,
}) => {
  const signup = await page.request.post("/api/auth/sign-up/email", {
    headers: { origin: baseURL! },
    data: {
      email: `blocked-${crypto.randomUUID()}@example.test`,
      name: "Blocked fixture",
      password: "SyntheticBlockedPassword2026",
    },
  });
  expect(signup.status()).toBe(404);
  // Inject into the response so the HTML parser, rather than DevTools evaluation,
  // attempts execution under the page's actual CSP.
  await page.route("**/login", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "</head>",
      "<script>window.__blockedInline = true</script></head>",
    );
    await route.fulfill({ response, body });
  });
  const response = await page.goto("/login");
  const headers = response!.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["cache-control"]).toContain("no-store");
  const csp = headers["content-security-policy"]!;
  const nonce = /'nonce-([^']+)'/.exec(csp)![1];
  expect(
    await page.locator("script#caab-theme").evaluate((el) => (el as HTMLScriptElement).nonce),
  ).toBe(nonce);
  expect(await page.locator("script").allTextContents()).toContain("window.__blockedInline = true");
  expect(await page.evaluate(() => "__blockedInline" in window)).toBe(false);
  await page.unroute("**/login");
  const next = await page.request.get("/login");
  expect(next.headers()["content-security-policy"]).not.toBe(csp);
  await page.getByLabel("E-mail").fill(syntheticUsers.administrator.email);
  await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.administrator.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page
    .getByRole("navigation", { name: "Navegação administrativa" })
    .getByRole("link", { name: "Colaboradores", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Colaboradores", exact: true })).toBeVisible();
  const me = await page.request.get("/api/v1/me");
  expect(me.status()).toBe(200);
  expect(me.headers()["cache-control"]).toContain("no-store");
});
