import { Client } from "pg";
import { readFile } from "node:fs/promises";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
import { readCsv, readXlsx, readPdf } from "../helpers/read-export";

test("scheduling read and export grants download three datasets and preserve context, retry and users export", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  const db = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await db.connect();
  const id = crypto.randomUUID(),
    name = `Exportação agenda ${id.slice(0, 8)}`;
  const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const ordinary = (
    await db.query('SELECT id FROM "user" WHERE email=$1', [syntheticUsers.ordinary.email])
  ).rows[0].id;
  const before = (
    await db.query("SELECT permissions FROM user_access WHERE user_id=$1", [ordinary])
  ).rows[0].permissions;
  try {
    await db.query(
      "UPDATE user_access SET permissions=ARRAY['scheduling:read','exports:generate','users:read'] WHERE user_id=$1",
      [ordinary],
    );
    await db.query("INSERT INTO member(id,name) VALUES($1,$2)", [id, name]);
    await db.query("INSERT INTO scheduling_unit(id,name) VALUES($1,$2)", [id, name]);
    await db.query("INSERT INTO scheduling_service(id,unit_id,name) VALUES($1,$1,$2)", [id, name]);
    await db.query(
      "INSERT INTO scheduling_procedure(id,unit_id,service_id,name,duration_minutes) VALUES($1,$1,$1,$2,60)",
      [id, name],
    );
    await db.query("INSERT INTO scheduling_professional(id,name) VALUES($1,$2)", [id, name]);
    await db.query(
      "INSERT INTO scheduling_assignment(id,unit_id,procedure_id,professional_id) VALUES($1,$1,$1,$1)",
      [id],
    );
    await db.query(
      "INSERT INTO scheduling_unit_hours(unit_id,weekday,start_local,end_local) VALUES($1,extract(dow FROM $2::date),'08:00','18:00')",
      [id, date],
    );
    await db.query(
      "INSERT INTO scheduling_professional_hours(professional_id,unit_id,weekday,start_local,end_local) VALUES($1,$1,extract(dow FROM $2::date),'08:00','18:00')",
      [id, date],
    );
    await db.query(
      "INSERT INTO scheduling_booking(id,assignment_id,professional_id,member_id,starts_at,ends_at,duration_snapshot,created_by) VALUES($1,$1,$1,$1,$2::timestamptz,$2::timestamptz+interval '1 hour',60,$3)",
      [id, `${date}T09:00:00-03:00`, ordinary],
    );
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(syntheticUsers.ordinary.email);
    await page.getByLabel("Senha", { exact: true }).fill(syntheticUsers.ordinary.password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto(`/scheduling?date=${date}&q=${encodeURIComponent(name)}`);
    await expect(page.getByRole("link", { name: "Nova reserva", exact: true })).toHaveCount(0);
    await page
      .locator(".panel-heading")
      .getByRole("link", { name: "Exportar Agendamentos", exact: true })
      .click();
    await expect(page.getByRole("textbox", { name: "Beneficiário", exact: true })).toHaveValue(
      name,
    );
    await expect(page.getByLabel("A partir de", { exact: true })).toHaveValue(date);
    await page.getByRole("button", { name: "Mover Beneficiário para cima", exact: true }).click();
    await page.getByRole("button", { name: "Mover Beneficiário para cima", exact: true }).click();
    await page.route(
      "**/api/v1/exports/download",
      async (route) => {
        const body = new URLSearchParams(route.request().postData()!);
        const config = JSON.parse(body.get("config")!);
        config.columns.push("cpf");
        body.set("config", JSON.stringify(config));
        await route.continue({ postData: body.toString() });
      },
      { times: 1 },
    );
    await page.getByRole("button", { name: "Exportar em CSV", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Confira os filtros" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Beneficiário", exact: true })).toHaveValue(
      name,
    );
    for (const dataset of ["bookings", "catalog", "hours"]) {
      if (dataset === "catalog") {
        await page.goto(`/scheduling/catalog?kind=units&q=${encodeURIComponent(name)}`);
        await page.getByRole("link", { name: "Exportar Agendamentos", exact: true }).click();
        await expect(page.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue(name);
      }
      if (dataset === "hours") {
        await page.goto("/scheduling/hours");
        const unit = page.getByRole("combobox", { name: "Unidade", exact: true });
        await unit.fill(name);
        await expect(page.getByRole("option").filter({ hasText: name })).toBeVisible();
        await unit.press("ArrowDown");
        await unit.press("Enter");
        await page.getByRole("link", { name: "Exportar Agendamentos", exact: true }).click();
        await expect(page.getByRole("combobox", { name: "Unidade", exact: true })).toHaveValue(
          name,
        );
      }
      for (const [format, label] of [
        ["csv", "CSV"],
        ["xlsx", "Excel"],
        ["pdf", "PDF"],
      ] as const) {
        const downloaded = page.waitForEvent("download");
        await page.getByRole("button", { name: `Exportar em ${label}`, exact: true }).click();
        const file = await downloaded;
        expect(await file.failure()).toBeNull();
        const bytes = await readFile((await file.path())!);
        if (format === "pdf")
          expect((await readPdf(bytes)).join(" ").replace(/\s/g, "")).toContain(
            id.replace(/\s/g, ""),
          );
        else {
          const rows = format === "csv" ? readCsv(bytes) : readXlsx(bytes)[1]!;
          expect(rows).toHaveLength(2);
          expect(rows[1]!.join(" ")).toContain(id);
          if (dataset === "bookings") expect(rows[0]![0]).toBe("Beneficiário");
        }
        await expect(
          page.getByRole("status").filter({ hasText: "Geração e transferência concluídas" }),
        ).toContainText("1 registro.");
      }
      for (const width of [390, 1280, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const theme of ["light", "dark"]) {
          await page.evaluate((theme) => {
            document.documentElement.dataset.theme = theme;
          }, theme);
          await expectWcag22AA(page);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          await page.evaluate(() => {
            (document.activeElement as HTMLElement)?.blur();
            window.scrollTo({ top: 0, behavior: "instant" });
          });
          await page.screenshot({
            path: testInfo.outputPath(`scheduling-export-${dataset}-${width}-${theme}.png`),
            fullPage: true,
          });
        }
      }
    }
    await page.goto("/users/exportar");
    await expect(
      page.getByRole("heading", { name: "Exportar colaboradores", exact: true }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Nome", exact: true }).fill("Nenhum usuário " + id);
    const usersFile = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar em CSV", exact: true }).click();
    expect(readCsv(await readFile((await (await usersFile).path())!))).toHaveLength(1);
  } finally {
    await db.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [ordinary, before]);
    await db.end();
  }
});
