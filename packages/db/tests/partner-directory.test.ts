import { readFile, readdir } from "node:fs/promises";
import { Client } from "pg";
import { expect, it } from "vitest";
import { startPostgres } from "./postgres-container";

it("backfills case-insensitive category links without losing existing partner data", async () => {
  const container = await startPostgres();
  const client = new Client({ connectionString: container.getConnectionUri() });
  await client.connect();
  try {
    const folder = new URL("../migrations/", import.meta.url);
    for (const name of (await readdir(folder))
      .filter((name) => /^\d{4}_.+\.sql$/.test(name) && name < "0017")
      .sort())
      await client.query(await readFile(new URL(name, folder), "utf8"));
    const ids: string[] = [];
    for (const category of ["Saúde", " SAÚDE ", "Cultura"])
      ids.push(
        (
          await client.query<{ id: string }>(
            "INSERT INTO partner(profile) VALUES($1) RETURNING id",
            [{ name: "Parceiro sintético", category, email: "preserved@example.test" }],
          )
        ).rows[0]!.id,
      );
    await client.query(await readFile(new URL("0017_partner_directory.sql", folder), "utf8"));
    const rows = (
      await client.query(
        "SELECT id,category_id,profile,version FROM partner WHERE id=ANY($1::uuid[])",
        [ids],
      )
    ).rows;
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((row) => row.category_id)).size).toBe(2);
    expect(
      rows.every((row) => row.profile.email === "preserved@example.test" && row.version === 1),
    ).toBe(true);
    expect((await client.query("SELECT mode,version FROM partner_app_settings")).rows).toEqual([
      { mode: "all", version: 1 },
    ]);
    expect(
      (await client.query("SELECT count(*)::int count FROM partner_review")).rows[0].count,
    ).toBe(0);
    await expect(
      client.query("UPDATE partner SET category_id=NULL WHERE id=$1", [ids[0]]),
    ).rejects.toMatchObject({ code: "23502" });
    const userId = (
      await client.query(
        "INSERT INTO \"user\"(name,email) VALUES('Sintético','migration@example.test') RETURNING id",
      )
    ).rows[0].id;
    await expect(
      client.query(
        "INSERT INTO partner_review(source_id,partner_id,author_reference,author_label,rating,comment,submitted_at,status,moderated_at,moderated_by) VALUES('synthetic',$1,'synthetic','Sintético',3,'Opinião',now(),'hidden',now(),$2)",
        [ids[0], userId],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  } finally {
    await client.end();
    await container.stop();
  }
}, 120000);
