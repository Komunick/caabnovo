import type { Pool } from "pg";

// Explicit table/column allowlists: never fetch a complete identity record.
export async function findAuditUserNames(pool: Pool, ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const result = await pool.query<{ id: string; name: string }>(
    `SELECT id, name FROM "user" WHERE id = ANY($1::uuid[])`,
    [ids],
  );
  return new Map(result.rows.map((row) => [row.id, row.name]));
}

export async function findAuditRoleNames(pool: Pool, ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const result = await pool.query<{ id: string; name: string }>(
    "SELECT id, name FROM role WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL",
    [ids],
  );
  return new Map(result.rows.map((row) => [row.id, row.name]));
}
