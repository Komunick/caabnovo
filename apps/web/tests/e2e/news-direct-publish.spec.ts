import { expect as baseExpect, syntheticUsers, test } from "./fixtures";

const expect = baseExpect.configure({ timeout: 15000 });

for (const media of ["cover", "body", "none"] as const) {
  test(`creates and publishes directly with ${media}, without manually saving a draft`, async ({
    page,
    request,
  }) => {
    test.setTimeout(120000);
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(syntheticUsers.accessManager.email);
    await page.getByLabel("Senha").fill(syntheticUsers.accessManager.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/news/new");
    await expect(page.getByLabel("Título", { exact: true })).toBeEnabled();
    const content = page.getByRole("textbox", { name: "Conteúdo da notícia", exact: true });
    await content.fill("Texto preservado durante o envio.");
    let id: string | undefined;
    let fileId: string | undefined;
    if (media !== "none") {
      const created = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/v1/news") && response.request().method() === "POST",
      );
      if (media === "body")
        await page.getByRole("button", { name: "Inserir imagem no corpo", exact: true }).click();
      const picker = media === "body" ? page.getByRole("dialog") : page.locator(".news-cover");
      await picker.getByLabel("Enviar imagem", { exact: true }).setInputFiles({
        name: `direto-${media}.png`,
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=",
          "base64",
        ),
      });
      const creation = await created;
      expect(creation.status()).toBe(201);
      id = (await creation.json()).id;
      await expect(
        picker.getByRole("status").filter({ hasText: "Imagem enviada para verificação" }),
      ).toBeVisible({ timeout: 30000 });
      await expect(page).toHaveURL(/\/news\/new$/);
      await picker
        .getByLabel(media === "body" ? "Descrição da imagem" : "Descrição da capa", { exact: true })
        .fill("Imagem sintética para publicação direta");
      if (media === "body")
        await picker.getByRole("button", { name: "Adicionar ao conteúdo" }).click();
      await expect(content).toContainText("Texto preservado durante o envio.");
      await expect
        .poll(
          async () => {
            const files = (await (await page.request.get(`/api/v1/news/${id}/media`)).json()).items;
            fileId = files[0]?.id;
            return files[0]?.usable;
          },
          { timeout: 60000 },
        )
        .toBe(true);
      expect((await request.get(`/api/v1/content/site/news/${id}`)).status()).toBe(404);
    }
    const title = `Publicação direta ${media} ${Date.now()}`;
    await page.getByLabel("Título", { exact: true }).fill(title);
    await page
      .getByRole("group", { name: "Destinos da ação" })
      .getByLabel("Site", { exact: true })
      .check();
    await page.getByRole("button", { name: "Publicar agora", exact: true }).click();
    if (media === "none") {
      let publications = 0;
      await page.route("**/api/v1/news/*/publish", (route) => {
        publications += 1;
        return route.continue();
      });
      await page.route("**/api/v1/news", (route) =>
        route.request().method() === "POST"
          ? route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
          : route.continue(),
      );
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Confirmar", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(
        page.getByRole("alert").filter({ hasText: "Seu texto continua no editor" }),
      ).toBeVisible();
      await expect(page.getByLabel("Título", { exact: true })).toHaveValue(title);
      expect(publications).toBe(0);
      await page.unroute("**/api/v1/news");
      await page.getByRole("button", { name: "Publicar agora", exact: true }).click();
    }
    await page.getByRole("dialog").getByRole("button", { name: "Confirmar", exact: true }).click();
    await expect(page).toHaveURL(/\/news\/[0-9a-f-]{36}$/, { timeout: 60000 });
    id = page.url().split("/").at(-1)!;
    const published = await request.get(`/api/v1/content/site/news/${id}`);
    expect(published.status()).toBe(200);
    const article = await published.json();
    expect(article.title).toBe(title);
    expect(article.slug.length).toBeLessThanOrEqual(80);
    expect(JSON.stringify(article.body)).toContain("Texto preservado durante o envio.");
    if (fileId) {
      const delivered = await request.get(`/api/v1/content/site/news/${id}/media/${fileId}`);
      expect(delivered.status()).toBe(200);
      expect(delivered.headers()["content-type"]).toContain("image/png");
    }
    await expect(page.getByLabel("Título", { exact: true })).toHaveValue(title);
  });
}
