import { syntheticUserContact } from "../helpers/user-contact";
import { Client } from "pg";
import { readFile, writeFile } from "node:fs/promises";
import { expect, syntheticUsers, test } from "./fixtures";
import { expectWcag22AA } from "./accessibility";
import { readCsv, readXlsx, readPdf } from "../helpers/read-export";
import type { APIResponse, Page } from "@playwright/test";
async function login(
  page: Page,
  email: string = syntheticUsers.administrator.email,
  password: string = syntheticUsers.administrator.password,
) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}
function db() {
  return new Client({
    connectionString:
      process.env.DATABASE_ADMIN_URL ?? "postgresql://postgres:change-me@127.0.0.1:5432/caab",
  });
}
test("direct exports keep filters and keyboard column order and download 100 records in all formats", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  const sql = db();
  await sql.connect();
  const prefix = `Exportação ${crypto.randomUUID().slice(0, 8)}`;
  const monitor = await page.context().newPage();
  try {
    await sql.query(
      `INSERT INTO "user"(name,email) SELECT $1||' '||lpad(n::text,3,'0'),$2||n||'@example.test' FROM generate_series(1,100)n`,
      [prefix, crypto.randomUUID()],
    );
    await login(page);
    await page.goto("/users");
    await page.getByRole("link", { name: "Exportar colaboradores", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Exportar colaboradores", exact: true }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Nome", exact: true }).fill(prefix);
    await page.getByRole("button", { name: "Mover E-mail para cima", exact: true }).focus();
    await page.keyboard.press("Enter");
    // Reject a tampered request in the real endpoint, then retry with the intact form.
    await page.route(
      "**/api/v1/exports/download",
      async (route) => {
        const body = new URLSearchParams(route.request().postData()!);
        const input = JSON.parse(body.get("config")!);
        input.columns.push("passwordHash");
        body.set("config", JSON.stringify(input));
        await route.continue({ postData: body.toString() });
      },
      { times: 1 },
    );
    await page.getByRole("button", { name: "Exportar em CSV", exact: true }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Confira os filtros e as colunas selecionadas" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue(prefix);
    const samples: number[] = [];
    for (const [format, label] of [
      ["xlsx", "Excel"],
      ["csv", "CSV"],
      ["pdf", "PDF"],
    ] as const) {
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: `Exportar em ${label}`, exact: true }).click();
      // Open the ordinary panel concurrently with the download, in the same session.
      const measurePanel = (async () => {
        for (let n = 0; n < 10; n++) {
          const start = performance.now();
          await monitor.goto("/users");
          await expect(
            monitor.getByRole("heading", { name: "Colaboradores", exact: true }),
          ).toBeVisible();
          samples.push(performance.now() - start);
        }
      })();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${format}$`));
      expect(await download.failure()).toBeNull();
      const file = await download.path();
      expect(file).toBeTruthy();
      const bytes = await readFile(file!);
      if (format === "csv") {
        const rows = readCsv(bytes);
        expect(rows[0]!.slice(0, 2)).toEqual(["E-mail", "Nome"]);
        expect(rows).toHaveLength(101);
        expect(rows.every((r, n) => n === 0 || r[1]!.startsWith(prefix))).toBe(true);
      }
      if (format === "xlsx") {
        const rows = readXlsx(bytes)[1]!;
        expect(rows[0]!.slice(0, 2)).toEqual(["E-mail", "Nome"]);
        expect(rows).toHaveLength(101);
      }
      if (format === "pdf") {
        const text = (await readPdf(bytes)).join(" ");
        for (let n = 1; n <= 100; n++)
          expect(text).toContain(`${prefix} ${String(n).padStart(3, "0")}`);
      }
      await expect(
        page.getByRole("status").filter({ hasText: "Geração e transferência concluídas" }),
      ).toContainText("100 registros");
      await expect(page.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue(prefix);
      await measurePanel;
    }
    const sorted = [...samples].sort((a, b) => a - b),
      p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]!;
    await writeFile(
      testInfo.outputPath("export-panel-profile.json"),
      JSON.stringify({ samples, p95, records: 100, node: process.version }),
    );
    await testInfo.attach("export-panel-profile", {
      body: JSON.stringify({
        samples,
        p95,
        records: 100,
        node: process.version,
        scope: "30 normal page openings started concurrently with the three downloads",
      }),
      contentType: "application/json",
    });
    expect(p95).toBeLessThanOrEqual(2000);
    await page.setViewportSize({ width: 390, height: 844 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("caab-theme", theme);
      }, theme);
      await expectWcag22AA(page);
      await page.screenshot({
        path: testInfo.outputPath(`export-${theme}-390.png`),
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      document.documentElement.dataset.theme = "light";
    });
    await expectWcag22AA(page);
    await page.screenshot({
      path: testInfo.outputPath("export-light-desktop.png"),
      fullPage: true,
    });
    await page
      .getByRole("textbox", { name: "Nome", exact: true })
      .fill("Sem resultado " + crypto.randomUUID());
    const empty = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar em CSV", exact: true }).click();
    const downloaded = await empty;
    expect(readCsv(await readFile((await downloaded.path())!))).toHaveLength(1);
  } finally {
    await monitor.close();
    await sql.end();
  }
});
test("general export alone exposes no administrative module and revocation hides navigation search and home", async ({
  page,
}) => {
  test.setTimeout(90000);
  await login(page);
  const email = `partial-export-${crypto.randomUUID()}@example.test`;
  const created = await page.request.post("/api/v1/users", {
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    },
    data: { ...syntheticUserContact(), name: "Colaborador parcial sintético", email, roleIds: [] },
  });
  expect(created.status()).toBe(201);
  const body = await created.json();
  const sql = db();
  await sql.connect();
  const user = body.user ?? body;
  const id = user.id;
  await sql.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['exports:generate'],$1) ON CONFLICT(user_id) DO UPDATE SET permissions=EXCLUDED.permissions",
    [id],
  );
  const context = await page
    .context()
    .browser()!
    .newContext({ baseURL: new URL(page.url()).origin });
  const partial = await context.newPage();
  try {
    await login(partial, email, body.initialPassword);
    for (const route of [
      "users",
      "members",
      "scheduling",
      "news",
      "partners",
      "reports",
      "messages",
      "audit",
    ])
      await expect(partial.locator(`a[href^="/${route}"]`)).toHaveCount(0);
    await partial.keyboard.press("Control+k");
    const search = partial.getByRole("dialog", { name: "Navegação rápida" });
    await search.getByLabel("Buscar funções e áreas").fill("exportar");
    await expect(search.getByRole("link")).toHaveCount(0);
    await partial.keyboard.press("Escape");
    await sql.query(
      "UPDATE user_access SET permissions=ARRAY['exports:generate','users:read','members:read'] WHERE user_id=$1",
      [id],
    );
    await partial.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(
      partial
        .getByRole("navigation", { name: "Navegação administrativa" })
        .getByRole("link", { name: "Associados", exact: true }),
    ).toBeVisible();
    await partial.goto("/users/exportar");
    await expect(partial.getByRole("heading", { name: "Exportar colaboradores" })).toBeVisible();
    await expect(partial.getByRole("checkbox", { name: "Funções", exact: true })).toHaveCount(0);
    await sql.query(
      "UPDATE user_access SET permissions=ARRAY['exports:generate'] WHERE user_id=$1",
      [id],
    );
    await partial.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(partial.getByRole("heading", { name: "Exportar colaboradores" })).toHaveCount(0);
    await partial.goto("/");
    await expect(
      partial.locator('a[href^="/users"],a[href^="/members"],a[href^="/scheduling"]'),
    ).toHaveCount(0);
  } finally {
    await context.close();
    await sql.end();
  }
});

test("manager grants a write they do not possess, resets a colleague password, and cannot manage their own access", async ({
  page,
}) => {
  test.setTimeout(90000);
  await login(page);
  const origin = new URL(page.url()).origin;
  const make = async (label: string) => {
    const response = await page.request.post("/api/v1/users", {
      headers: {
        origin,
        "x-csrf-token": crypto.randomUUID(),
        "idempotency-key": crypto.randomUUID(),
      },
      data: {
        ...syntheticUserContact(),
        name: label,
        email: `role-${crypto.randomUUID()}@example.test`,
        roleIds: [],
      },
    });
    expect(response.status()).toBe(201);
    return response.json();
  };
  const manager = await make("Gestor sintético exportação"),
    colleague = await make("Colaborador sem gestão");
  const sql = db();
  await sql.connect();
  // New accounts start with the base role, and only one role may be in force at a time.
  await sql.query(
    "UPDATE user_role SET revoked_at=now(),revocation_origin='system',revocation_reason='Synthetic role replacement' WHERE user_id=$1 AND revoked_at IS NULL",
    [manager.id],
  );
  await sql.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification) SELECT $1,id,$1,'Synthetic manager role' FROM role WHERE code='manager'",
    [manager.id],
  );
  const managerContext = await page.context().browser()!.newContext({ baseURL: origin }),
    colleagueContext = await page.context().browser()!.newContext({ baseURL: origin });
  const view = await managerContext.newPage();
  try {
    await login(view, manager.email, manager.initialPassword);
    await view.goto("/users");
    await expect(
      view.getByRole("link", { name: "Exportar colaboradores", exact: true }),
    ).toBeVisible();
    await expect(view.getByRole("button", { name: "Criar colaborador", exact: true })).toHaveCount(
      0,
    );
    const denied = await view.request.post("/api/v1/members", {
      headers: {
        origin,
        "x-csrf-token": crypto.randomUUID(),
        "idempotency-key": crypto.randomUUID(),
      },
      data: { ...syntheticUserContact(), name: "Write must be denied" },
    });
    expect(denied.status()).toBe(403);
    await view.goto(`/users/${colleague.id}`);
    await expect(view.getByRole("button", { name: "Conceder função", exact: true })).toHaveCount(0);
    await view
      .getByRole("checkbox", { name: "Cadastrar e editar associados", exact: true })
      .check();
    await view.getByRole("checkbox", { name: "Consultar colaboradores", exact: true }).check();
    await view.getByRole("button", { name: "Salvar acessos", exact: true }).click();
    await expect(view.getByRole("status").filter({ hasText: "Acessos atualizados" })).toBeVisible();
    await expect(view.getByRole("button", { name: "Salvar alterações", exact: true })).toHaveCount(
      0,
    );
    await view.getByRole("button", { name: "Gerar nova senha", exact: true }).click();
    await view.getByRole("button", { name: "Confirmar nova senha", exact: true }).click();
    const receipt = view.getByRole("region", { name: "Nova senha do colaborador" });
    await expect(receipt).toBeVisible();
    const password = await receipt.getByLabel("Nova senha", { exact: true }).inputValue();
    await view.goto(`/users/${manager.id}`);
    await expect(view.getByRole("button", { name: "Salvar acessos", exact: true })).toHaveCount(0);
    await expect(
      view.getByRole("checkbox", { name: "Cadastrar e editar associados", exact: true }),
    ).toBeDisabled();
    await expect(
      view.getByRole("checkbox", { name: "Cadastrar e editar associados", exact: true }),
    ).not.toBeChecked();
    const endUser = await colleagueContext.newPage();
    await login(endUser, colleague.email, password);
    await endUser.goto(`/users/${manager.id}`);
    await expect(endUser.getByRole("button", { name: "Salvar acessos", exact: true })).toHaveCount(
      0,
    );
    await expect(
      endUser.getByRole("button", { name: "Gerar nova senha", exact: true }),
    ).toHaveCount(0);
    await expect(endUser.getByRole("button", { name: "Conceder função", exact: true })).toHaveCount(
      0,
    );
  } finally {
    await managerContext.close();
    await colleagueContext.close();
    await sql.end();
  }
});

test("a real collaborator executes a delegated write, the manager stays denied, and forged calls cannot grant access or roles", async ({
  page,
}) => {
  test.setTimeout(150000);
  await login(page);
  const origin = new URL(page.url()).origin;
  const headers = () => ({
    origin,
    "x-csrf-token": crypto.randomUUID(),
    "idempotency-key": crypto.randomUUID(),
  });
  const rolesResponse = await page.request.get("/api/v1/roles");
  expect(rolesResponse.status()).toBe(200);
  const roleList = (await rolesResponse.json()) as { id: string; code: string }[];
  const roleId = (code: string) => {
    const role = roleList.find((candidate) => candidate.code === code);
    expect(role, `role ${code}`).toBeTruthy();
    return role!.id;
  };
  const managerRoleId = roleId("manager"),
    collaboratorRoleId = roleId("collaborator"),
    administratorRoleId = roleId("administrator");
  const make = async (label: string, roleIds: string[]) => {
    const response = await page.request.post("/api/v1/users", {
      headers: headers(),
      data: {
        ...syntheticUserContact(),
        name: label,
        email: `role-${crypto.randomUUID()}@example.test`,
        roleIds,
      },
    });
    expect(response.status(), label).toBe(201);
    return response.json();
  };
  // The manager role is granted through the API; an empty roleIds list exercises the base role.
  const manager = await make("Gestor real delegação", [managerRoleId]),
    colleague = await make("Colaborador real delegação", []),
    target = await make("Colaborador alvo delegação", []);
  const sql = db();
  await sql.connect();
  const managerContext = await page.context().browser()!.newContext({ baseURL: origin }),
    colleagueContext = await page.context().browser()!.newContext({ baseURL: origin });
  try {
    const activeRoleCodes = async (id: string) =>
      (
        await sql.query<{ code: string }>(
          `SELECT r.code FROM user_role ur JOIN role r ON r.id=ur.role_id
           WHERE ur.user_id=$1 AND ur.revoked_at IS NULL AND ur.valid_from<=clock_timestamp()
             AND (ur.valid_until IS NULL OR ur.valid_until>clock_timestamp()) ORDER BY r.code`,
          [id],
        )
      ).rows.map((row) => row.code);
    // Default base role: the account without a chosen role is a real Collaborator.
    expect(await activeRoleCodes(manager.id)).toEqual(["manager"]);
    expect(await activeRoleCodes(colleague.id)).toEqual(["collaborator"]);
    expect(await activeRoleCodes(target.id)).toEqual(["collaborator"]);

    const readAccess = async (id: string) => {
      const stored = await sql.query<{ version: number }>(
        "SELECT version FROM user_access WHERE user_id=$1",
        [id],
      );
      const effective = await sql.query<{ permission: string }>(
        "SELECT permission FROM effective_user_permission WHERE user_id=$1 ORDER BY permission",
        [id],
      );
      return {
        version: stored.rows[0]?.version ?? 0,
        permissions: effective.rows.map((row) => row.permission),
      };
    };
    const accessBody = (current: { version: number; permissions: string[] }, add: string[]) => ({
      permissions: [...new Set([...current.permissions, ...add])],
      expectedPermissions: current.permissions,
      version: current.version,
      justification: "Alteração sintética de acessos",
    });
    const watched = [manager.id, colleague.id, target.id];
    const successActions = [
      "user.created",
      "user.access.updated",
      "user.role.granted",
      "user.role.revoked",
      "user.password.reset",
    ];
    const state = async () => ({
      access: (
        await sql.query(
          "SELECT user_id::text AS user_id, permissions, version FROM user_access WHERE user_id=ANY($1::uuid[]) ORDER BY user_id",
          [watched],
        )
      ).rows,
      roles: (
        await sql.query(
          "SELECT id::text AS id, user_id::text AS user_id, role_id::text AS role_id, valid_from, valid_until, revoked_at FROM user_role WHERE user_id=ANY($1::uuid[]) ORDER BY user_id, id",
          [watched],
        )
      ).rows,
      users: (
        await sql.query(
          'SELECT id::text AS id, version, status FROM "user" WHERE id=ANY($1::uuid[]) ORDER BY id',
          [watched],
        )
      ).rows,
      events: (
        await sql.query<{ n: number }>(
          `SELECT count(*)::int AS n FROM audit_event WHERE action=ANY($1::text[])
             AND (entity_id=ANY($2::text[]) OR actor_user_id=ANY($3::uuid[]))`,
          [successActions, watched, [manager.id, colleague.id]],
        )
      ).rows[0]!.n,
    });
    // Every denial must come from authorization and must leave access, roles and audit untouched.
    const expectDenied = async (label: string, call: () => Promise<APIResponse>, code: string) => {
      const before = await state();
      const response = await call();
      expect(response.status(), label).toBe(403);
      expect(((await response.json()) as { code: string }).code, label).toBe(code);
      expect(await state(), label).toEqual(before);
    };

    const view = await managerContext.newPage();
    await login(view, manager.email, manager.initialPassword);
    const endUser = await colleagueContext.newPage();
    await login(endUser, colleague.email, colleague.initialPassword);
    const member = () => ({
      profile: {
        name: `Associado delegado ${crypto.randomUUID().slice(0, 8)}`,
        oab: {
          state: "BA",
          type: "lawyer",
          number: String(100000 + (Number.parseInt(crypto.randomUUID().slice(0, 6), 16) % 900000)),
        },
      },
      justification: "Escrita delegada sintética",
    });
    const memberCount = async (name: string) =>
      (
        await sql.query<{ n: number }>("SELECT count(*)::int AS n FROM member WHERE name=$1", [
          name,
        ])
      ).rows[0]!.n;

    // The base role alone grants nothing: the Collaborator cannot write members yet.
    const withoutGrant = member();
    const beforeGrant = await endUser.request.post("/api/v1/members", {
      headers: headers(),
      data: withoutGrant,
    });
    expect(beforeGrant.status()).toBe(403);
    expect(await memberCount(withoutGrant.profile.name)).toBe(0);

    // The manager delegates a write they do not possess, with its prerequisite.
    const current = await readAccess(colleague.id);
    expect(current).toEqual({ version: 0, permissions: [] });
    const delegation = await view.request.put(`/api/v1/users/${colleague.id}/access`, {
      headers: headers(),
      data: accessBody(current, ["members:read", "members:write"]),
    });
    expect(delegation.status()).toBe(200);
    expect(((await delegation.json()) as { permissions: string[] }).permissions).toEqual([
      "members:read",
      "members:write",
    ]);
    expect((await readAccess(colleague.id)).permissions).toEqual(["members:read", "members:write"]);
    expect(await activeRoleCodes(colleague.id)).toEqual(["collaborator"]);
    const delegated = await sql.query<{ actor: string | null }>(
      "SELECT actor_user_id::text AS actor FROM audit_event WHERE action='user.access.updated' AND entity_id=$1",
      [colleague.id],
    );
    expect(delegated.rows).toEqual([{ actor: manager.id }]);

    // The Collaborator executes the received write; the manager, repeating the same body, stays denied.
    const delegatedMember = member();
    const created = await endUser.request.post("/api/v1/members", {
      headers: headers(),
      data: delegatedMember,
    });
    expect(created.status()).toBe(201);
    expect(await memberCount(delegatedMember.profile.name)).toBe(1);
    await expectDenied(
      "manager repeats the delegated write",
      () => view.request.post("/api/v1/members", { headers: headers(), data: delegatedMember }),
      "PERMISSION_DENIED",
    );
    expect(await memberCount(delegatedMember.profile.name)).toBe(1);

    // Forged calls by the Collaborator, who holds neither access nor role management.
    const forgedContact = {
      ...syntheticUserContact(),
      name: "Conta forjada pelo colaborador",
      email: `forged-${crypto.randomUUID()}@example.test`,
      roleIds: [administratorRoleId],
    };
    const targetAccess = await readAccess(target.id);
    expect(targetAccess).toEqual({ version: 0, permissions: [] });
    const targetVersion = (
      await sql.query<{ version: number }>('SELECT version FROM "user" WHERE id=$1', [target.id])
    ).rows[0]!.version;
    const collaboratorForged: [string, () => Promise<APIResponse>][] = [
      [
        "collaborator edits a third party's access",
        () =>
          endUser.request.put(`/api/v1/users/${target.id}/access`, {
            headers: headers(),
            data: accessBody(targetAccess, ["members:read"]),
          }),
      ],
      [
        "collaborator edits the manager's access",
        () =>
          endUser.request.put(`/api/v1/users/${manager.id}/access`, {
            headers: headers(),
            data: accessBody(targetAccess, ["members:read"]),
          }),
      ],
      [
        "collaborator grants the manager role",
        () =>
          endUser.request.put(`/api/v1/users/${target.id}/roles/${managerRoleId}`, {
            headers: headers(),
            data: { justification: "Escalada forjada" },
          }),
      ],
      [
        "collaborator grants the administrator role",
        () =>
          endUser.request.put(`/api/v1/users/${target.id}/roles/${administratorRoleId}`, {
            headers: headers(),
            data: { justification: "Escalada forjada" },
          }),
      ],
      [
        "collaborator revokes a role",
        () =>
          endUser.request.delete(
            `/api/v1/users/${target.id}/roles/${collaboratorRoleId}?justification=Revogacao%20forjada`,
            { headers: headers() },
          ),
      ],
      [
        "collaborator promotes a role",
        () =>
          endUser.request.post(`/api/v1/users/${target.id}/roles/${collaboratorRoleId}/promote`, {
            headers: headers(),
          }),
      ],
      [
        "collaborator creates an account with a role",
        () => endUser.request.post("/api/v1/users", { headers: headers(), data: forgedContact }),
      ],
      [
        "collaborator resets a password",
        () =>
          endUser.request.post(`/api/v1/users/${target.id}/reset-password`, {
            headers: headers(),
            data: { version: targetVersion },
          }),
      ],
    ];
    for (const [label, call] of collaboratorForged)
      await expectDenied(label, call, "PERMISSION_DENIED");
    const forgedAccount = await sql.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM "user" WHERE email=$1',
      [forgedContact.email],
    );
    expect(forgedAccount.rows[0]!.n).toBe(0);

    // Forged calls by the manager, who can edit access but never management keys or roles.
    const managerCurrent = await readAccess(manager.id);
    for (const key of ["access:manage", "roles:grant", "roles:revoke", "users:reset-password"]) {
      const currentColleague = await readAccess(colleague.id);
      await expectDenied(
        `manager grants ${key}`,
        () =>
          view.request.put(`/api/v1/users/${colleague.id}/access`, {
            headers: headers(),
            data: accessBody(currentColleague, [key, "users:read", "roles:read"]),
          }),
        "ROLE_GRANT_DENIED",
      );
    }
    await expectDenied(
      "manager edits their own access",
      () =>
        view.request.put(`/api/v1/users/${manager.id}/access`, {
          headers: headers(),
          data: accessBody(managerCurrent, ["members:write"]),
        }),
      "SELF_ESCALATION_DENIED",
    );
    for (const [label, grantedRoleId] of [
      ["manager grants the manager role", managerRoleId],
      ["manager grants the administrator role", administratorRoleId],
    ] as const)
      await expectDenied(
        label,
        () =>
          view.request.put(`/api/v1/users/${colleague.id}/roles/${grantedRoleId}`, {
            headers: headers(),
            data: { justification: "Escalada forjada" },
          }),
        "PERMISSION_DENIED",
      );
    await expectDenied(
      "manager promotes the colleague",
      () =>
        view.request.post(`/api/v1/users/${colleague.id}/roles/${collaboratorRoleId}/promote`, {
          headers: headers(),
        }),
      "PERMISSION_DENIED",
    );
    await expectDenied(
      "manager creates an administrator",
      () =>
        view.request.post("/api/v1/users", {
          headers: headers(),
          data: { ...forgedContact, email: `forged-${crypto.randomUUID()}@example.test` },
        }),
      "PERMISSION_DENIED",
    );

    // Legacy management keys stored for the Collaborator are ignored by the effective permissions.
    // users:read and roles:read are planted too, so the access route lets the call reach the service
    // and only the view's filter of management keys stands between the Collaborator and the change.
    await sql.query(
      `UPDATE user_access
       SET permissions = permissions || ARRAY['users:read','roles:read','access:manage','roles:grant','roles:revoke','users:reset-password']::text[]
       WHERE user_id=$1`,
      [colleague.id],
    );
    expect((await readAccess(colleague.id)).permissions).toEqual([
      "members:read",
      "members:write",
      "roles:read",
      "users:read",
    ]);
    await expectDenied(
      "collaborator with legacy keys edits a third party's access",
      () =>
        endUser.request.put(`/api/v1/users/${target.id}/access`, {
          headers: headers(),
          data: accessBody(targetAccess, ["members:read"]),
        }),
      "PERMISSION_DENIED",
    );
    await expectDenied(
      "collaborator with legacy keys promotes a role",
      () =>
        endUser.request.post(`/api/v1/users/${target.id}/roles/${collaboratorRoleId}/promote`, {
          headers: headers(),
        }),
      "PERMISSION_DENIED",
    );
    await expectDenied(
      "collaborator with legacy keys grants a role",
      () =>
        endUser.request.put(`/api/v1/users/${target.id}/roles/${managerRoleId}`, {
          headers: headers(),
          data: { justification: "Escalada forjada" },
        }),
      "PERMISSION_DENIED",
    );

    // Nothing leaked: roles are unchanged, only the delegation was audited, and the manager is still denied.
    expect(await activeRoleCodes(manager.id)).toEqual(["manager"]);
    expect(await activeRoleCodes(colleague.id)).toEqual(["collaborator"]);
    expect(await activeRoleCodes(target.id)).toEqual(["collaborator"]);
    expect(await readAccess(target.id)).toEqual({ version: 0, permissions: [] });
    const changes = await sql.query<{ action: string; entity_id: string }>(
      `SELECT action, entity_id FROM audit_event WHERE entity_id=ANY($1::text[])
         AND action IN ('user.access.updated','user.role.granted','user.role.revoked','user.password.reset')`,
      [watched],
    );
    expect(changes.rows).toEqual([{ action: "user.access.updated", entity_id: colleague.id }]);
    await expectDenied(
      "manager stays denied after the forged calls",
      () => view.request.post("/api/v1/members", { headers: headers(), data: member() }),
      "PERMISSION_DENIED",
    );
  } finally {
    await managerContext.close();
    await colleagueContext.close();
    await sql.end();
  }
});

test("exports collaborator contact filtered by CPF and pending deletion in Excel, CSV and PDF", async ({
  page,
}, info) => {
  await login(page);
  const contact = syntheticUserContact();
  const name = `Contato exportação ${crypto.randomUUID()}`;
  const response = await page.request.post("/api/v1/users", {
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    },
    data: { ...contact, name, email: `contact-${crypto.randomUUID()}@example.test`, roleIds: [] },
  });
  expect(response.status()).toBe(201);
  const user = await response.json();
  const deleted = await page.request.post(`/api/v1/users/${user.id}/lifecycle`, {
    headers: {
      origin: new URL(page.url()).origin,
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    },
    data: { action: "delete", version: user.version, reason: "Exportação sintética de pendentes" },
  });
  expect(deleted.status()).toBe(200);
  await page.goto("/users/exportar");
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill(name);
  await page
    .getByRole("textbox", { name: "CPF", exact: true })
    .fill(contact.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"));
  await page.getByLabel("Cadastros", { exact: true }).selectOption("pending");
  await expectWcag22AA(page);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("heading", { name: "Exportar colaboradores", exact: true }).click();
    await expectWcag22AA(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await page.screenshot({
      animations: "disabled",
      path: info.outputPath(`collaborator-export-filters-${width}.png`),
      fullPage: true,
    });
  }

  for (const label of ["CPF", "Telefone", "Endereço"])
    await page.getByRole("checkbox", { name: label, exact: true }).check();
  for (const [format, label] of [
    ["xlsx", "Excel"],
    ["csv", "CSV"],
    ["pdf", "PDF"],
  ] as const) {
    const promise = page.waitForEvent("download");
    await page.getByRole("button", { name: `Exportar em ${label}`, exact: true }).click();
    const download = await promise;
    expect(await download.failure()).toBeNull();
    const bytes = await readFile((await download.path())!);
    const content =
      format === "pdf"
        ? (await readPdf(bytes)).join(" ")
        : JSON.stringify(format === "csv" ? readCsv(bytes) : readXlsx(bytes));
    expect(content).toContain(contact.cpf);
    expect(content).toContain(contact.phone);
    expect(content).toContain(contact.address.street);
    expect(content).toContain(contact.address.postalCode);
    await expect(
      page.getByRole("status").filter({ hasText: "Geração e transferência concluídas" }),
    ).toContainText("1 registro.");
  }
});
