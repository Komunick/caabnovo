import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import type { Page, TestInfo } from "@playwright/test";
import { test, expect, syntheticUsers } from "./fixtures";
import { expectWcag22AA, expectThemeContrast } from "./accessibility";
import { readCsv, readXlsx, readPdf } from "../helpers/read-export";

async function login(
  page: Page,
  user: { email: string; password: string } = syntheticUsers.administrator,
) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function fixture(db: Client) {
  const id = randomUUID(),
    name = `Pessoa falta ${id.slice(0, 8)}`;
  const actor = (
    await db.query('SELECT id FROM "user" WHERE email=$1', [syntheticUsers.administrator.email])
  ).rows[0].id;
  await db.query("INSERT INTO member(id,name) VALUES($1,$2)", [id, name]);
  await db.query("INSERT INTO scheduling_unit(id,name) VALUES($1,$2)", [id, name]);
  await db.query("INSERT INTO scheduling_service(id,unit_id,name,policy) VALUES($1,$1,$2,$3)", [
    id,
    name,
    JSON.stringify({ mode: "capacity", capacity: 100, immediateConfirmation: true }),
  ]);
  await db.query(
    "INSERT INTO scheduling_procedure(id,unit_id,service_id,name,duration_minutes) VALUES($1,$1,$1,$2,60)",
    [id, name],
  );
  const bookings: string[] = [];
  for (const days of [-2, 2, 40]) {
    const booking = randomUUID();
    await db.query(
      `INSERT INTO scheduling_booking(id,procedure_id,member_id,starts_at,ends_at,duration_snapshot,created_by,mode,confirmed_reschedules)
      VALUES($1,$2,$2,date_trunc('hour',statement_timestamp())+$3*interval '1 day',date_trunc('hour',statement_timestamp())+$3*interval '1 day'+interval '1 hour',60,$4,'capacity',0)`,
      [booking, id, days, actor],
    );
    bookings.push(booking);
  }
  return { id, name, actor, past: bookings[0]!, inside: bookings[1]!, outside: bookings[2]! };
}

async function mutate(page: Page, path: string, data: unknown) {
  const origin = new URL(page.url()).origin;
  const response = await page.request.post(`${origin}/api/v1/scheduling/${path}`, {
    data,
    headers: { origin, "x-csrf-token": randomUUID(), "idempotency-key": randomUUID() },
  });
  expect(response.ok(), await response.text()).toBe(true);
  return response.json();
}

async function capture(page: Page, info: TestInfo, name: string) {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.locator("html").evaluate((element, theme) => {
        element.dataset.theme = theme;
      }, theme);
      await expectWcag22AA(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      await page.screenshot({
        path: info.outputPath(`${name}-${width}-${theme}.png`),
        fullPage: true,
      });
    }
  }
}

test("record, preserve deadlines and draft, upload privately, submit and accept through the panel", async ({
  page,
}, info) => {
  test.setTimeout(300000);
  const db = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await db.connect();
  try {
    const data = await fixture(db);
    await login(page);
    await page.goto(`/scheduling/${data.past}`);
    const record = page.getByRole("button", { name: "Registrar falta", exact: true });
    await record.focus();
    await record.press("Enter");
    await expect(
      page.getByRole("dialog", { name: "Registrar falta ao atendimento?" }),
    ).toBeVisible();
    await expectWcag22AA(page);
    await page.getByRole("button", { name: "Confirmar registro da falta", exact: true }).click();
    await expect(page.getByRole("button", { name: "OK", exact: true })).toBeVisible();
    const original = (
      await db.query("SELECT * FROM scheduling_absence WHERE booking_id=$1", [data.past])
    ).rows[0];
    expect(+original.appeal_deadline - +original.recorded_at).toBe(7 * 86400000);
    expect(+original.restriction_ends_at - +original.recorded_at).toBe(30 * 86400000);
    await page.getByRole("button", { name: "OK", exact: true }).click();
    expect(
      (await db.query("SELECT * FROM scheduling_absence WHERE id=$1", [original.id])).rows[0],
    ).toEqual(original);
    await page.getByRole("button", { name: "Justificar falta", exact: true }).click();
    await page.getByRole("button", { name: "Enviar pedido para análise", exact: true }).click();
    await expect(page.getByLabel("Explicação obrigatória", { exact: true })).toBeFocused();
    await expect(
      page.getByText("Explique a justificativa ou contestação.", { exact: true }),
    ).toBeVisible();
    const explanation = "Explicação sintética confidencial para decisão exclusiva da equipe.";
    await page.getByLabel("Explicação obrigatória", { exact: true }).fill(explanation);
    await page.getByLabel("Comprovante obrigatório", { exact: true }).setInputFiles({
      name: "prova-sintetica.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nComprovante sintetico\n%%EOF"),
    });
    await page.getByRole("button", { name: "Enviar comprovante", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Atualizar verificação", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Enviar pedido para análise", exact: true }).click();
    await expect(
      page.getByText("Anexe pelo menos um comprovante liberado pela verificação de segurança.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      (
        await db.query("SELECT count(*) FROM scheduling_absence_appeal WHERE absence_id=$1", [
          original.id,
        ])
      ).rows[0].count,
    ).toBe("0");
    // Client navigation keeps the authenticated in-memory draft; a browser reload is not promised.
    await page.getByRole("link", { name: "Faltas", exact: true }).click();
    await page.getByRole("link", { name: new RegExp(`Ver falta de ${data.name}`) }).click();
    await page.getByRole("button", { name: "Justificar falta", exact: true }).click();
    await expect(page.getByLabel("Explicação obrigatória", { exact: true })).toHaveValue(
      explanation,
    );
    await expect(page.getByText(/prova-sintetica.pdf · Aguardando verificação/)).toBeVisible();
    // Only the disposable fixture models a clean scanner result; no real worker/scanner is started.
    const file = (
      await db.query(
        "SELECT id FROM stored_file WHERE owner_id=$1 AND original_name='prova-sintetica.pdf'",
        [data.id],
      )
    ).rows[0].id;
    await db.query("UPDATE stored_file SET scan_result='clean',status='scanning' WHERE id=$1", [
      file,
    ]);
    await db.query(
      "UPDATE stored_file_content c SET object_key=f.object_key FROM stored_file f WHERE c.file_id=f.id AND f.id=$1",
      [file],
    );
    await db.query("UPDATE stored_file SET status='available' WHERE id=$1", [file]);
    await page.getByRole("button", { name: "Atualizar verificação", exact: true }).click();
    await expect(
      page.getByText("Comprovante liberado para anexar ao pedido.", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Enviar pedido para análise", exact: true }).click();
    await expect(page.locator("#falta").getByText("Em análise", { exact: true })).toBeVisible();
    expect(
      (
        await db.query("SELECT status FROM scheduling_booking WHERE id=ANY($1::uuid[])", [
          [data.inside, data.outside],
        ])
      ).rows.map((row) => row.status),
    ).toEqual(["scheduled", "scheduled"]);
    await page
      .getByRole("button", { name: "Consultar pedido e comprovantes", exact: true })
      .click();
    await expect(page.getByText(explanation, { exact: true })).toBeVisible();
    await capture(page, info, "absence-review");
    await expectThemeContrast(page, "#falta dt, #falta dd, #falta p");
    await page.getByRole("button", { name: "Aceitar pedido", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Aceitar este pedido?" })).toBeVisible();
    await page.getByRole("button", { name: "Confirmar decisão", exact: true }).click();
    await expect(page.locator("#falta").getByText("Falta abonada", { exact: true })).toBeVisible();
    await expect(page.getByText("Restrição encerrada", { exact: true })).toBeVisible();
    const final = (await db.query("SELECT * FROM scheduling_absence WHERE id=$1", [original.id]))
      .rows[0];
    expect(final.appeal_deadline).toEqual(original.appeal_deadline);
    expect(final.restriction_ends_at).toEqual(original.restriction_ends_at);
    expect(
      (
        await db.query(
          "SELECT count(*) FROM scheduling_absence_notification_intent i JOIN scheduling_absence_event e ON e.id=i.event_id WHERE e.absence_id=$1",
          [original.id],
        )
      ).rows[0].count,
    ).toBe("3");

    await page.getByRole("link", { name: "Faltas", exact: true }).click();
    await page.getByLabel("Nome do beneficiário", { exact: true }).fill(data.name);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
    await page.getByLabel("Situação", { exact: true }).selectOption("accepted");
    await expect(page).toHaveURL(/status=accepted/);
    await expect(
      page.getByRole("link", { name: new RegExp(`Ver falta de ${data.name}`) }),
    ).toBeVisible();
    await capture(page, info, "absence-list");
    await page.getByRole("link", { name: "Exportar Agendamentos", exact: true }).click();
    await expect(page).toHaveURL(/dataset=absences/);
    await expect(
      page.getByRole("textbox", { name: "Nome do beneficiário", exact: true }),
    ).toHaveValue(data.name);
    for (const [format, label] of [
      ["csv", "CSV"],
      ["xlsx", "Excel"],
      ["pdf", "PDF"],
    ] as const) {
      const downloading = page.waitForEvent("download");
      await page.getByRole("button", { name: `Exportar em ${label}`, exact: true }).click();
      const download = await downloading;
      expect(await download.failure()).toBeNull();
      const bytes = await readFile((await download.path())!);
      const content =
        format === "pdf"
          ? (await readPdf(bytes)).join(" ")
          : (format === "csv" ? readCsv(bytes) : readXlsx(bytes)[1]!).flat().join(" ");
      expect(content.replace(/\s/g, "")).toContain(data.name.replace(/\s/g, ""));
      expect(content).not.toContain(explanation);
      expect(content).not.toContain("prova-sintetica.pdf");
    }
    await capture(page, info, "absence-export");
  } finally {
    await db.end();
  }
});

test("review grant without write decides and reads evidence; ordinary readers cannot access the request", async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);
  const db = new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
  await db.connect();
  const ordinary = (
    await db.query('SELECT id FROM "user" WHERE email=$1', [syntheticUsers.ordinary.email])
  ).rows[0].id;
  const permissions = (
    await db.query("SELECT permissions FROM user_access WHERE user_id=$1", [ordinary])
  ).rows[0].permissions;
  const reviewerContext = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL });
  try {
    const data = await fixture(db);
    await login(page);
    const absence = await mutate(page, `bookings/${data.past}/absence`, { expectedVersion: 1 });
    const file = randomUUID(),
      bytes = Buffer.from("%PDF-1.4\nProva revisao sintetica\n%%EOF");
    await db.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,detected_mime,visibility,status,scan_result,uploaded_by)
      VALUES($1::uuid,'member',$2,'prova-restrita.pdf','database/private/'||$1::text,'database/quarantine/'||$1::text,'application/pdf','application/pdf','private','available','clean',$3)`,
      [file, data.id, data.actor],
    );
    await db.query(
      "INSERT INTO stored_file_content(file_id,object_key,body) VALUES($1::uuid,'database/private/'||$1::text,$2)",
      [file, bytes],
    );
    const explanation = "Contestação sintética de acesso restrito.";
    await mutate(page, `absences/${absence.id}/appeal`, {
      expectedVersion: 1,
      kind: "contestation",
      explanation,
      evidenceFileIds: [file],
    });
    await db.query(
      "UPDATE user_access SET permissions=ARRAY['scheduling:read','scheduling:review_absences'] WHERE user_id=$1",
      [ordinary],
    );
    const reviewer = await reviewerContext.newPage();
    await login(reviewer, syntheticUsers.ordinary);
    await reviewer.goto(`/scheduling/${data.past}`);
    await expect(reviewer.getByRole("link", { name: "Nova reserva", exact: true })).toHaveCount(0);
    await reviewer
      .getByRole("button", { name: "Consultar pedido e comprovantes", exact: true })
      .click();
    await expect(reviewer.getByText(explanation, { exact: true })).toBeVisible();
    const grant = await reviewer.request.get(
      `/api/v1/scheduling/absences/${absence.id}/evidence?fileId=${file}`,
    );
    expect(grant.ok(), await grant.text()).toBe(true);
    const download = await reviewer.request.get((await grant.json()).url);
    expect(download.ok()).toBe(true);
    expect(await download.body()).toEqual(bytes);
    await reviewer.getByRole("button", { name: "Rejeitar pedido", exact: true }).click();
    await expect(reviewer.getByRole("dialog", { name: "Rejeitar este pedido?" })).toBeVisible();
    await reviewer.getByRole("button", { name: "Confirmar decisão", exact: true }).click();
    await expect(
      reviewer.locator("#falta").getByText("Pedido rejeitado", { exact: true }),
    ).toBeVisible();
    expect(
      (await db.query("SELECT status FROM scheduling_booking WHERE id=$1", [data.inside])).rows[0]
        .status,
    ).toBe("cancelled");
    expect(
      (await db.query("SELECT status FROM scheduling_booking WHERE id=$1", [data.outside])).rows[0]
        .status,
    ).toBe("scheduled");
    await db.query("UPDATE user_access SET permissions=ARRAY['scheduling:read'] WHERE user_id=$1", [
      ordinary,
    ]);
    await reviewer.reload();
    await expect(
      reviewer.locator("#falta").getByText("Pedido rejeitado", { exact: true }),
    ).toBeVisible();
    await expect(
      reviewer.getByRole("button", { name: "Consultar pedido e comprovantes", exact: true }),
    ).toHaveCount(0);
    await expect(reviewer.getByText(explanation, { exact: true })).toHaveCount(0);
    const denied = await reviewer.request.get(`/api/v1/scheduling/absences/${absence.id}/review`);
    expect(denied.status()).toBe(403);
    const metadata = await reviewer.request.get(
      `/api/v1/scheduling/absences?bookingId=${data.past}`,
    );
    expect(metadata.ok()).toBe(true);
    expect(await metadata.text()).not.toContain(explanation);
  } finally {
    await reviewerContext.close();
    await db.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
      ordinary,
      permissions,
    ]);
    await db.end();
  }
});
