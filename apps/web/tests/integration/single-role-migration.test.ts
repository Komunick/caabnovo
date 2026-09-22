import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
let container: StartedPostgreSqlContainer, db: Client;
const folder = resolve("packages/db/migrations");
beforeAll(async () => {
  container = await startPostgres();
  db = new Client({ connectionString: container.getConnectionUri() });
  await db.connect();
  for (const name of (await readdir(folder))
    .filter((name) => /^\d{4}.*\.sql$/.test(name) && name < "0030")
    .sort())
    await db.query(await readFile(resolve(folder, name), "utf8"));
  await db.query(
    "INSERT INTO role(code,name,description,is_administrative) VALUES('administrator','Administrador','Teste',true)",
  );
}, 120000);
afterAll(async () => {
  await db?.end();
  await container?.stop();
});
it("keeps the highest current role and explicit accesses, with truthful system revocation and unchanged history", async () => {
  const users = (
    await db.query(
      `INSERT INTO "user"(name,email) VALUES('All roles','all@example.test'),('Manager','manager@example.test'),('Expired administrator','expired@example.test') RETURNING id`,
    )
  ).rows;
  const [all, manager, expired] = users.map((row) => row.id);
  await db.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) SELECT id,ARRAY['news:read','news:write'],id FROM \"user\"",
  );
  const accessBefore = (await db.query("SELECT * FROM user_access ORDER BY user_id")).rows;
  for (const [id, codes] of [
    [all, ["administrator", "manager", "collaborator"]],
    [manager, ["manager", "collaborator"]],
    [expired, ["administrator", "collaborator"]],
  ] as const) {
    for (const code of codes) {
      const past = id === expired && code === "administrator";
      await db.query(
        `INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_from,valid_until)
        SELECT $1,id,$1,'Original history',now()-interval '2 days',CASE WHEN $3 THEN now()-interval '1 day' ELSE NULL END FROM role WHERE code=$2`,
        [id, code, past],
      );
    }
  }
  const permissionsBefore = (
    await db.query("SELECT * FROM effective_user_permission ORDER BY user_id,permission")
  ).rows;
  const history = (
    await db.query(
      "SELECT id,user_id,role_id,granted_by,justification,valid_from,valid_until FROM user_role ORDER BY id",
    )
  ).rows;
  await db.query("BEGIN");
  await db.query(await readFile(resolve(folder, "0030_single_user_role.sql"), "utf8"));
  await db.query("COMMIT");
  const active = (
    await db.query(
      `SELECT ur.user_id,r.code FROM user_role ur JOIN role r ON r.id=ur.role_id WHERE ur.revoked_at IS NULL AND tstzrange(ur.valid_from,ur.valid_until,'[)') @> now()`,
    )
  ).rows;
  expect(
    (await db.query("SELECT * FROM effective_user_permission ORDER BY user_id,permission")).rows,
  ).toEqual(permissionsBefore);
  expect(active).toHaveLength(3);
  expect(active).toEqual(
    expect.arrayContaining([
      { user_id: all, code: "administrator" },
      { user_id: manager, code: "manager" },
      { user_id: expired, code: "collaborator" },
    ]),
  );
  expect((await db.query("SELECT * FROM user_access ORDER BY user_id")).rows).toEqual(accessBefore);
  expect(
    (
      await db.query(
        "SELECT id,user_id,role_id,granted_by,justification,valid_from,valid_until FROM user_role ORDER BY id",
      )
    ).rows,
  ).toEqual(history);
  const revoked = (
    await db.query(
      "SELECT revoked_by,revocation_origin FROM user_role WHERE revoked_at IS NOT NULL",
    )
  ).rows;
  expect(revoked).toHaveLength(4);
  expect(
    revoked.every((row) => row.revoked_by === null && row.revocation_origin === "system"),
  ).toBe(true);
  const audit = (
    await db.query(
      "SELECT actor_user_id,origin,before,after FROM audit_event WHERE effective_identity='system:migration:0030'",
    )
  ).rows;
  expect(audit).toHaveLength(4);
  expect(
    audit.every(
      (row) =>
        row.actor_user_id === null &&
        row.origin === "system" &&
        row.before.assigned &&
        !row.after.assigned,
    ),
  ).toBe(true);
  const extra = (
    await db.query(
      `INSERT INTO "user"(name,email) VALUES('Consecutive','consecutive@example.test') RETURNING id`,
    )
  ).rows[0].id;
  await db.query(
    `INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_from,valid_until)
    SELECT $1,id,$1,'', '2020-01-01', '2020-02-01' FROM role WHERE code='manager'`,
    [extra],
  );
  await db.query(
    `INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_from,valid_until)
    SELECT $1,id,$1,'', '2020-02-01', '2020-03-01' FROM role WHERE code='collaborator'`,
    [extra],
  );
  await expect(
    db.query(
      `INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_from)
    SELECT $1,id,$1,'','2020-01-15' FROM role WHERE code='administrator'`,
      [extra],
    ),
  ).rejects.toMatchObject({ code: "23P01" });
});
