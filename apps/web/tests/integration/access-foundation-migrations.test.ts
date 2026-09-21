import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";
import Cursor from "pg-cursor";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";

let container: StartedPostgreSqlContainer, db: Client;
const folder = resolve("packages/db/migrations");
const apply = async (name: string) => {
  await db.query(await readFile(resolve(folder, name), "utf8"));
};
const permissions = async (id: string) =>
  (
    await db.query<{ permission: string }>(
      "SELECT permission FROM effective_user_permission WHERE user_id=$1 ORDER BY permission",
      [id],
    )
  ).rows.map((row) => row.permission);
async function account(name: string, keys?: string[]) {
  const id = (
    await db.query('INSERT INTO "user"(name,email) VALUES($1,$2) RETURNING id', [
      name,
      `${name}@example.test`,
    ])
  ).rows[0].id as string;
  if (keys)
    await db.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,$2,$1)", [
      id,
      keys,
    ]);
  return id;
}
async function assign(userId: string, code: string, expired = false) {
  await db.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_from,valid_until) SELECT $1,id,$1,'teste',now()-interval '2 days',CASE WHEN $3 THEN now()-interval '1 day' ELSE NULL END FROM role WHERE code=$2",
    [userId, code, expired],
  );
}
beforeAll(async () => {
  container = await startPostgres();
  db = new Client({ connectionString: container.getConnectionUri() });
  await db.connect();
  for (const file of (await readdir(folder))
    .filter((file) => /^\d{4}.*\.sql$/.test(file) && file < "0025")
    .sort())
    await apply(file);
  await db.query(
    "INSERT INTO role(code,name,description,is_administrative) VALUES('administrator','Administrador','Administrador',true),('legacy','Legado','Teste',false)",
  );
  await db.query(
    "INSERT INTO permission(resource,action,description) VALUES('audit','export','Exportar'),('audit','read','Consultar') ON CONFLICT DO NOTHING",
  );
}, 120000);
afterAll(async () => {
  await db?.end();
  await container?.stop();
});

it("migrates export keys separately, then derives live role bases without assigning accounts", async () => {
  const explicit = await account("explicit", ["audit:read", "audit:export", "reports:export"]);
  const empty = await account("empty", []);
  const inherited = await account("inherited");
  const expired = await account("expired");
  await db.query(
    "INSERT INTO role_permission(role_id,permission_id) SELECT r.id,p.id FROM role r CROSS JOIN permission p WHERE r.code='legacy' AND p.resource='audit'",
  );
  await assign(inherited, "legacy");
  await assign(expired, "legacy", true);
  const roleLinks = (await db.query("SELECT * FROM user_role ORDER BY id")).rows;
  await apply("0025_general_export_permission.sql");
  expect(await permissions(explicit)).toEqual(["audit:read", "exports:generate"]);
  expect(await permissions(empty)).toEqual([]);
  expect(await permissions(inherited)).toContain("exports:generate");
  expect(await permissions(expired)).not.toContain("exports:generate");
  expect(await permissions(expired)).toContain("news:read");
  expect(
    (await db.query("SELECT version FROM user_access WHERE user_id=$1", [explicit])).rows[0]
      .version,
  ).toBe(2);
  await apply("0025_general_export_permission.sql");
  expect(
    (await db.query("SELECT version FROM user_access WHERE user_id=$1", [explicit])).rows[0]
      .version,
  ).toBe(2);
  expect((await db.query("SELECT * FROM user_role ORDER BY id")).rows).toEqual(roleLinks);
  await apply("0026_explicit_module_access.sql");
  expect((await db.query("SELECT * FROM user_role ORDER BY id")).rows).toEqual(roleLinks);
  expect(await permissions(expired)).toEqual([]);
  expect(await permissions(empty)).toEqual([]);
  const administrator = await account("administrator", []);
  const manager = await account("manager", []);
  const collaborator = await account("collaborator", [
    "members:read",
    "roles:grant",
    "access:manage",
  ]);
  await assign(administrator, "administrator");
  await assign(manager, "manager");
  await assign(collaborator, "collaborator");
  const all = (
    await db.query("SELECT resource||':'||action AS key FROM permission ORDER BY key")
  ).rows.map((row) => row.key);
  expect(await permissions(administrator)).toEqual(all);
  expect(await permissions(manager)).toEqual(
    expect.arrayContaining([
      "scheduling:read",
      "exports:generate",
      "reports:read",
      "access:manage",
      "messages:access",
    ]),
  );
  expect(await permissions(manager)).not.toContain("members:write");
  expect(await permissions(manager)).not.toContain("messages:write");
  expect(await permissions(manager)).not.toContain("roles:grant");
  expect(await permissions(collaborator)).toEqual(["members:read"]);
  await db.query(
    "INSERT INTO permission(resource,action,description) VALUES('future_test','read','Teste'),('future_test','write','Teste'),('reports','future_test','Teste')",
  );
  expect(await permissions(administrator)).toContain("future_test:write");
  expect(await permissions(manager)).toContain("future_test:read");
  expect(await permissions(manager)).toContain("reports:future_test");
  expect(await permissions(manager)).not.toContain("future_test:write");
  await db.query(
    "UPDATE user_role SET revoked_at=now(),revoked_by=$1,revocation_reason='Teste' WHERE user_id=$1",
    [manager],
  );
  expect(await permissions(manager)).toEqual([]);
  await db.query("UPDATE \"user\" SET status='disabled',deactivated_at=now() WHERE id=$1", [
    administrator,
  ]);
  expect(await permissions(administrator)).toEqual([]);
});

it("reads 100 records through pg-cursor and releases an early-closed snapshot", async () => {
  await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const cursor = db.query(new Cursor<{ id: number }>("SELECT generate_series(1,100) AS id"));
  const result: number[] = [];
  while (true) {
    const rows = await cursor.read(17);
    if (!rows.length) break;
    result.push(...rows.map((row) => row.id));
  }
  await cursor.close();
  await db.query("ROLLBACK");
  expect(result).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
  const early = db.query(new Cursor("SELECT generate_series(1,100) AS id"));
  expect(await early.read(1)).toHaveLength(1);
  await early.close();
  expect((await db.query("SELECT 1 AS ready")).rows[0].ready).toBe(1);
});
