import { loadWorkspaceEnv } from "@caab/config/load-env";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createDatabaseClient } from "./client";

export async function runMigrations(connectionString: string): Promise<void> {
  const client = createDatabaseClient(connectionString, { max: 1 });
  const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), "../migrations");
  try {
    await client.pool.query(`
      CREATE TABLE IF NOT EXISTS caab_schema_migration (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(migrationsFolder))
      .filter((file) => /^\d{4}_.+\.sql$/.test(file))
      .sort();
    for (const name of files) {
      const sql = await readFile(resolve(migrationsFolder, name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existing = await client.pool.query<{ checksum: string }>(
        "SELECT checksum FROM caab_schema_migration WHERE name = $1",
        [name],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum)
          throw new Error(`Applied migration changed: ${name}`);
        continue;
      }

      const connection = await client.pool.connect();
      try {
        await connection.query("BEGIN");
        await connection.query(sql);
        await connection.query(
          "INSERT INTO caab_schema_migration(name, checksum) VALUES ($1, $2)",
          [name, checksum],
        );
        await connection.query("COMMIT");
      } catch (error) {
        await connection.query("ROLLBACK");
        throw error;
      } finally {
        connection.release();
      }
    }
  } finally {
    await client.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadWorkspaceEnv();
  const connectionString = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_ADMIN_URL or DATABASE_URL is required");
  await runMigrations(connectionString);
}
