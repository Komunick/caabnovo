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

/** Name-only enrichment intersects request grants with the current, live session grants. */
export async function findAuditTargetNames(
  pool: Pool,
  actor: { userId: string; sessionId: string; permissions: ReadonlySet<string> },
  targets: { entityType: string; entityId: string }[],
) {
  const supported = targets.filter((target) =>
    ["member", "partner", "news", "message", "messaging_preference", "stored_file"].includes(
      target.entityType,
    ),
  );
  if (!supported.length) return new Map<string, string>();
  const result = await pool.query<{ type: string; id: string; name: string }>(
    `WITH targets AS (
       SELECT * FROM unnest($1::text[], $2::uuid[]) AS t(type,id)
     ), grants AS (
       SELECT permission FROM effective_user_permission p
       WHERE p.user_id=$3 AND p.permission=ANY($5::text[])
         AND EXISTS (SELECT 1 FROM session s JOIN "user" u ON u.id=s.user_id
           WHERE s.id=$4 AND u.id=$3 AND u.status='active'
             AND s.revoked_at IS NULL AND s.expires_at>now())
     )
     SELECT t.type,m.id,m.name FROM targets t JOIN member m ON t.type='member' AND t.id=m.id
       WHERE EXISTS (SELECT 1 FROM grants WHERE permission='members:read')
     UNION ALL
     SELECT t.type,p.id,p.profile->>'name' FROM targets t JOIN partner p ON t.type='partner' AND t.id=p.id
       WHERE EXISTS (SELECT 1 FROM grants WHERE permission='partners:read')
     UNION ALL
     SELECT t.type,r.id,r.data->>'name' FROM targets t JOIN messaging_resource r ON t.type='message' AND t.id=r.id
       WHERE EXISTS (SELECT 1 FROM grants WHERE permission='messages:access')
     UNION ALL
     SELECT t.type,m.id,m.name FROM targets t JOIN member m ON t.type='messaging_preference' AND t.id=m.id
       WHERE EXISTS (SELECT 1 FROM grants WHERE permission='messages:access')
     UNION ALL
     SELECT t.type,n.id,n.metadata_title FROM targets t JOIN news n ON t.type='news' AND t.id=n.id
       WHERE EXISTS (SELECT 1 FROM grants WHERE permission='news:read')
     UNION ALL
     SELECT t.type,f.id,f.original_name FROM targets t JOIN stored_file f ON t.type='stored_file' AND t.id=f.id
       WHERE f.deleted_at IS NULL AND EXISTS (SELECT 1 FROM grants WHERE permission='files:read')
         AND EXISTS (SELECT 1 FROM grants WHERE permission=CASE f.owner_type
           WHEN 'member' THEN 'members:read' WHEN 'partner' THEN 'partners:read'
           WHEN 'news' THEN 'news:read' WHEN 'audit_export' THEN 'audit:read'
           WHEN 'user' THEN 'users:read' END)`,
    [
      supported.map((target) => target.entityType),
      supported.map((target) => target.entityId),
      actor.userId,
      actor.sessionId,
      [...actor.permissions],
    ],
  );
  return new Map(
    result.rows
      .filter((row) => typeof row.name === "string" && row.name.trim())
      .map((row) => [`${row.type}:${row.id}`, row.name]),
  );
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
