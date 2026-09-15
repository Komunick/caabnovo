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
export async function listAuditActors(
  pool: Pool,
  query: { q: string; cursor?: string; limit: number },
) {
  const pattern = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
  const result = await pool.query<{ id: string; name: string }>(
    `SELECT u.id, u.name FROM "user" u
     WHERE u.name ILIKE $1 AND ($2::uuid IS NULL OR u.id > $2::uuid)
       AND EXISTS (SELECT 1 FROM audit_event a WHERE a.actor_user_id = u.id)
     ORDER BY u.id LIMIT $3`,
    [pattern, query.cursor ?? null, query.limit + 1],
  );
  const items = result.rows.slice(0, query.limit);
  return { items, nextCursor: result.rows.length > query.limit ? items.at(-1)!.id : null };
}
