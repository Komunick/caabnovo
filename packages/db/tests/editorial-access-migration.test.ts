import { readFile, readdir } from "node:fs/promises";
import { Client } from "pg";
import { expect, it } from "vitest";
import { startPostgres } from "./postgres-container";

it("preserves the migration cohort, explicit denials and dynamic RBAC, but denies future accounts by default", async () => {
  const container = await startPostgres();
  const db = new Client({ connectionString: container.getConnectionUri() });
  await db.connect();
  try {
    const folder = new URL("../migrations/", import.meta.url);
    for (const file of (await readdir(folder))
      .filter((name) => /^\d{4}_.+\.sql$/.test(name) && name < "0024_")
      .sort())
      await db.query(await readFile(new URL(file, folder), "utf8"));
    async function user(name: string) {
      return (
        await db.query('INSERT INTO "user"(name,email) VALUES ($1,$2) RETURNING id', [
          name,
          `${name}@example.test`,
        ])
      ).rows[0].id as string;
    }
    async function permissions(id: string) {
      return (
        await db.query(
          "SELECT permission FROM effective_user_permission WHERE user_id=$1 ORDER BY permission",
          [id],
        )
      ).rows.map((row) => row.permission);
    }
    const inherited = await user("inherited"),
      denied = await user("denied"),
      explicit = await user("explicit");
    await db.query(
      "INSERT INTO user_access(user_id,permissions,updated_by) VALUES ($1,'{}',$1),($2,ARRAY['members:read'],$2)",
      [denied, explicit],
    );
    const role = (
      await db.query(
        "INSERT INTO role(code,name,description) VALUES ('prior-role','Prior role','fixture') RETURNING id",
      )
    ).rows[0].id;
    await db.query(
      "INSERT INTO role_permission SELECT $1,id,now() FROM permission WHERE resource='members' AND action='read'",
      [role],
    );
    await db.query(
      "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES ($1,$2,$1,'fixture')",
      [inherited, role],
    );
    const before = await permissions(inherited);
    expect(before).toEqual(["members:read", "news:publish", "news:read", "news:write"]);
    await db.query("BEGIN");
    await db.query(await readFile(new URL("0024_explicit_editorial_access.sql", folder), "utf8"));
    await db.query("COMMIT");
    expect(await permissions(inherited)).toEqual(before);
    expect(await permissions(denied)).toEqual([]);
    expect(await permissions(explicit)).toEqual(["members:read"]);
    const fresh = await user("fresh");
    expect(await permissions(fresh)).toEqual([]);
    await db.query(
      "INSERT INTO role_permission SELECT $1,id,now() FROM permission WHERE resource='members' AND action='write'",
      [role],
    );
    expect(await permissions(inherited)).toContain("members:write");
    await db.query(
      "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES ($1,$2,$1,'fixture')",
      [fresh, role],
    );
    expect(await permissions(fresh)).toEqual(["members:read", "members:write"]);
    await db.query(
      "UPDATE user_role SET revoked_at=now(),revoked_by=user_id,revocation_reason='fixture' WHERE role_id=(SELECT id FROM role WHERE code='legacy-editorial-access')",
    );
    expect(await permissions(inherited)).toEqual(["members:read", "members:write"]);
    expect(
      (await db.query("SELECT id FROM audit_event WHERE action='user.access.migrated'")).rowCount,
    ).toBe(1);
  } finally {
    await db.end();
    await container.stop();
  }
}, 120000);
