import { readFile } from "node:fs/promises";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "../src/migrate.js";
import { startPostgres } from "./postgres-container.js";

let container: StartedPostgreSqlContainer;
let admin: Client;

beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
}, 120_000);

afterAll(async () => {
  await admin?.end();
  await container?.stop();
});

describe("database foundation migrations", () => {
  it("apply from an empty PostgreSQL database", async () => {
    const result = await admin.query<{ name: string }>(
      "SELECT name FROM caab_schema_migration ORDER BY name",
    );
    expect(result.rows.map(({ name }) => name)).toEqual([
      "0001_identity.sql",
      "0002_rbac.sql",
      "0003_audit.sql",
      "0004_runtime_privileges.sql",
      "0005_operations.sql",
      "0006_pgboss.sql",
      "0007_news.sql",
      "0008_news_actions.sql",
      "0009_news_highlights.sql",
      "0010_members.sql",
      "0011_account_email_change.sql",
      "0012_remove_authenticator.sql",
      "0013_member_administrative_status.sql",
      "0014_user_access.sql",
      "0015_member_profile_photo.sql",
      "0016_partners.sql",
      "0017_partner_directory.sql",
      "0018_database_file_content.sql",
      "0019_news_creation_lifecycle.sql",
    ]);
  });

  it("provisions the isolated pg-boss schema for the runtime role", async () => {
    const result = await admin.query<{ owner: string; version: number }>(
      `SELECT n.nspowner::regrole::text AS owner, v.version
       FROM pg_namespace n
       CROSS JOIN pgboss.version v
       WHERE n.nspname = 'pgboss'`,
    );
    expect(result.rows).toEqual([{ owner: "caab_runtime", version: 40 }]);

    await admin.query("SET ROLE caab_runtime");
    await admin.query(
      `SELECT pgboss.create_queue(
        'migration-test',
        '{"policy":"standard","retryLimit":2,"retryDelay":0,"retryBackoff":false,"expireInSeconds":900,"retentionSeconds":1209600,"deleteAfterSeconds":604800,"partition":false,"notify":false}'::jsonb
      )`,
    );
    const queue = await admin.query<{ name: string }>(
      "SELECT name FROM pgboss.queue WHERE name = 'migration-test'",
    );
    await admin.query("RESET ROLE");
    expect(queue.rows).toEqual([{ name: "migration-test" }]);
  });

  it("backfills publication history without reopening legacy drafts", async () => {
    const migration = await readFile(
      new URL("../migrations/0019_news_creation_lifecycle.sql", import.meta.url),
      "utf8",
    );
    await admin.query("BEGIN");
    try {
      // Temporary tables shadow the real schema only in this isolated connection.
      await admin.query(`
        CREATE TEMP TABLE news (id text PRIMARY KEY, _status text, updated_at timestamptz);
        CREATE TEMP TABLE audit_event (
          entity_type text, entity_id text, action text, occurred_at timestamptz
        );
        CREATE TEMP TABLE _news_v (
          parent_id text, version__status text, created_at timestamptz
        );
        INSERT INTO news VALUES
          ('audit', 'draft', '2026-09-14T00:00:00Z'),
          ('version', 'draft', '2026-09-14T00:00:00Z'),
          ('published', 'published', '2026-09-14T00:00:00Z'),
          ('draft', 'draft', '2026-09-14T00:00:00Z');
        INSERT INTO audit_event VALUES
          ('news', 'audit', 'news.published', '2026-09-10T00:00:00Z'),
          ('news', 'audit', 'news.published', '2026-09-12T00:00:00Z'),
          ('other', 'draft', 'news.published', '2026-09-10T00:00:00Z');
        INSERT INTO _news_v VALUES
          ('version', 'published', '2026-09-11T00:00:00Z'),
          ('draft', 'draft', '2026-09-11T00:00:00Z');
      `);
      await admin.query(migration);
      const result = await admin.query<{
        id: string;
        creation_pending: boolean;
        first_published_at: Date | null;
      }>("SELECT id, creation_pending, first_published_at FROM news ORDER BY id");
      expect(
        result.rows.map((row) => ({
          ...row,
          first_published_at: row.first_published_at?.toISOString() ?? null,
        })),
      ).toEqual([
        { id: "audit", creation_pending: false, first_published_at: "2026-09-10T00:00:00.000Z" },
        { id: "draft", creation_pending: false, first_published_at: null },
        {
          id: "published",
          creation_pending: false,
          first_published_at: "2026-09-14T00:00:00.000Z",
        },
        { id: "version", creation_pending: false, first_published_at: "2026-09-11T00:00:00.000Z" },
      ]);
    } finally {
      await admin.query("ROLLBACK");
    }
  });

  it("prevents audit UPDATE and DELETE for the runtime role", async () => {
    const requestId = crypto.randomUUID();
    const inserted = await admin.query<{ id: string }>(
      `INSERT INTO audit_event
       (effective_identity, action, entity_type, entity_id, origin, request_id, correlation_id)
       VALUES ('system', 'foundation.test', 'test', '1', 'system', $1, $1) RETURNING id`,
      [requestId],
    );
    const id = inserted.rows[0]?.id;
    expect(id).toBeTruthy();

    await admin.query("SET ROLE caab_runtime");
    await expect(
      admin.query("UPDATE audit_event SET action = 'changed' WHERE id = $1", [id]),
    ).rejects.toMatchObject({ code: "42501" });
    await admin.query("ROLLBACK").catch(() => undefined);

    await expect(admin.query("DELETE FROM audit_event WHERE id = $1", [id])).rejects.toMatchObject({
      code: "42501",
    });
    await admin.query("ROLLBACK").catch(() => undefined);
    await admin.query("RESET ROLE");
  });
});
