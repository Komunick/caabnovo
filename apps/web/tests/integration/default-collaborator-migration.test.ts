import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";

let container: StartedPostgreSqlContainer, db: Client;
const folder = resolve("packages/db/migrations");
const migration = "0035_default_collaborator_role.sql";

beforeAll(async () => {
  container = await startPostgres();
  db = new Client({ connectionString: container.getConnectionUri() });
  await db.connect();
  for (const name of (await readdir(folder))
    .filter((name) => /^\d{4}.*\.sql$/.test(name) && name < "0035")
    .sort())
    await db.query(await readFile(resolve(folder, name), "utf8"));
  await db.query(
    "INSERT INTO role(code,name,description,is_administrative) VALUES('administrator','Administrador','Teste',true) ON CONFLICT(code) DO NOTHING",
  );
}, 120000);

afterAll(async () => {
  await db?.end();
  await container?.stop();
});

async function applyMigration() {
  await db.query("BEGIN");
  try {
    await db.query(await readFile(resolve(folder, migration), "utf8"));
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

describe.sequential("default collaborator role migration", () => {
  it("refuses to run when the base role is missing, inactive or carries permissions", async () => {
    await db.query("UPDATE role SET status='inactive' WHERE code='collaborator'");
    await expect(applyMigration()).rejects.toThrow(/ausente ou inativo/);
    await db.query("UPDATE role SET status='active' WHERE code='collaborator'");

    await db.query(
      "INSERT INTO permission(resource,action,description) VALUES('news','read','Teste') ON CONFLICT(resource,action) DO NOTHING",
    );
    await db.query(
      `INSERT INTO role_permission(role_id,permission_id)
       SELECT r.id,p.id FROM role r, permission p WHERE r.code='collaborator' AND p.resource='news' AND p.action='read'`,
    );
    await expect(applyMigration()).rejects.toThrow(/permissões próprias/);
    await db.query(
      "DELETE FROM role_permission WHERE role_id=(SELECT id FROM role WHERE code='collaborator')",
    );

    // Nothing from the refused attempts persists: the transaction rolled back the schema changes.
    const column = await db.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name='user_role' AND column_name='grant_origin'",
    );
    expect(column.rowCount).toBe(0);
  });

  it("gives every account without a role in force the base role, without touching access or history", async () => {
    const users = (
      await db.query(
        `INSERT INTO "user"(name,email,status,deletion_effective_at) VALUES
          ('No role','none@example.test','active',NULL),
          ('Explicit access','access@example.test','active',NULL),
          ('Expired administrator','expired@example.test','active',NULL),
          ('Revoked only','revoked@example.test','active',NULL),
          ('Current administrator','admin@example.test','active',NULL),
          ('Future manager','future@example.test','active',NULL),
          ('Deleted','deleted@example.test','disabled',now()-interval '1 hour'),
          ('Disabled','disabled@example.test','disabled',NULL)
         RETURNING id,email`,
      )
    ).rows as { id: string; email: string }[];
    const id = (name: string) => users.find((user) => user.email === `${name}@example.test`)!.id;

    await db.query(
      "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['news:read'],$1)",
      [id("access")],
    );
    const role = async (code: string) =>
      (await db.query<{ id: string }>("SELECT id FROM role WHERE code=$1", [code])).rows[0]!.id;
    const history = async (
      user: string,
      code: string,
      from: string,
      until: string | null,
      revoked = false,
    ) =>
      db.query(
        `INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_from,valid_until,revoked_at,revoked_by,revocation_reason)
         VALUES($1,$2,$1,'Original history',now()+$3::interval,CASE WHEN $4::text IS NULL THEN NULL ELSE now()+$4::interval END,
           CASE WHEN $5 THEN now() ELSE NULL END,CASE WHEN $5 THEN $1::uuid ELSE NULL END,CASE WHEN $5 THEN 'Revoked' ELSE NULL END)`,
        [user, await role(code), from, until, revoked],
      );
    await history(id("expired"), "administrator", "-3 days", "-1 day");
    await history(id("revoked"), "collaborator", "-3 days", null, true);
    await history(id("admin"), "administrator", "-3 days", null);
    await history(id("future"), "manager", "2 days", null);

    const accessBefore = (await db.query("SELECT * FROM user_access ORDER BY user_id")).rows;
    const permissionsBefore = (
      await db.query("SELECT * FROM effective_user_permission ORDER BY user_id,permission")
    ).rows;
    const rolesBefore = (await db.query("SELECT * FROM user_role ORDER BY id")).rows;

    await applyMigration();

    expect((await db.query("SELECT * FROM user_access ORDER BY user_id")).rows).toEqual(
      accessBefore,
    );
    expect(
      (await db.query("SELECT * FROM effective_user_permission ORDER BY user_id,permission")).rows,
    ).toEqual(permissionsBefore);
    // Pre-existing assignments keep their rows; only the new origin column appears.
    const rolesAfter = (await db.query("SELECT * FROM user_role ORDER BY id")).rows;
    for (const before of rolesBefore) {
      expect(rolesAfter.find((row) => row.id === before.id)).toMatchObject({
        ...before,
        grant_origin: "web",
      });
    }

    const added = (
      await db.query<{
        user_id: string;
        code: string;
        granted_by: string | null;
        grant_origin: string;
        valid_until: Date | null;
        revoked_at: Date | null;
      }>(
        `SELECT ur.user_id,r.code,ur.granted_by,ur.grant_origin,ur.valid_until,ur.revoked_at
         FROM user_role ur JOIN role r ON r.id=ur.role_id WHERE ur.grant_origin='system'`,
      )
    ).rows;
    expect(added.map((row) => row.user_id).sort()).toEqual(
      ["none", "access", "expired", "revoked", "future", "disabled"].map(id).sort(),
    );
    for (const row of added) {
      expect(row).toMatchObject({ code: "collaborator", granted_by: null, revoked_at: null });
    }
    // The base role ends where the already granted future role begins.
    const future = (
      await db.query<{ valid_from: Date }>(
        "SELECT valid_from FROM user_role WHERE user_id=$1 AND grant_origin='web'",
        [id("future")],
      )
    ).rows[0]!;
    expect(added.find((row) => row.user_id === id("future"))!.valid_until).toEqual(
      future.valid_from,
    );
    expect(
      added.filter((row) => row.user_id !== id("future")).every((row) => !row.valid_until),
    ).toBe(true);
    // The current administrator and the already deleted account are left alone.
    expect(added.some((row) => [id("admin"), id("deleted")].includes(row.user_id))).toBe(false);

    const audit = (
      await db.query<{ entity_id: string; origin: string; effective_identity: string }>(
        "SELECT entity_id,origin,effective_identity FROM audit_event WHERE effective_identity='system:migration:0035'",
      )
    ).rows;
    expect(audit.map((row) => row.entity_id).sort()).toEqual(
      added.map((row) => row.user_id).sort(),
    );
    expect(audit.every((row) => row.origin === "system")).toBe(true);
  });

  it("requires a granting user for web grants and none for system grants", async () => {
    const user = (
      await db.query<{ id: string }>(
        `INSERT INTO "user"(name,email) VALUES('Constraint','constraint@example.test') RETURNING id`,
      )
    ).rows[0]!.id;
    const role = (await db.query<{ id: string }>("SELECT id FROM role WHERE code='manager'"))
      .rows[0]!.id;
    await expect(
      db.query(
        "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES($1,$2,NULL,'Sem autor')",
        [user, role],
      ),
    ).rejects.toMatchObject({ constraint: "user_role_grant_origin_consistent" });
    await expect(
      db.query(
        "INSERT INTO user_role(user_id,role_id,granted_by,grant_origin,justification) VALUES($1,$2,$1,'system','Autor indevido')",
        [user, role],
      ),
    ).rejects.toMatchObject({ constraint: "user_role_grant_origin_consistent" });
  });
});
