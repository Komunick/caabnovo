import type { Pool, PoolClient } from "pg";

type DatabaseConnection = Pool | PoolClient;

export interface RoleReferenceRecord {
  id: string;
  code: string;
  name: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  status: "active" | "disabled";
  twoFactorEnabled: boolean;
  roles: RoleReferenceRecord[];
  version: number;
  createdAt: Date;
  updatedAt: Date | null;
  deactivatedAt: Date | null;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  status: "active" | "disabled";
  two_factor_enabled: boolean;
  roles: RoleReferenceRecord[] | null;
  version: number;
  created_at: Date;
  updated_at: Date | null;
  deactivated_at: Date | null;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    twoFactorEnabled: false,
    roles: row.roles ?? [],
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
  };
}

const userSelection = `u.id, u.email::text, u.name, u.status, u.two_factor_enabled, u.version,
  u.created_at, u.updated_at, u.deactivated_at,
  COALESCE(
    jsonb_agg(DISTINCT jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name))
      FILTER (WHERE r.id IS NOT NULL), '[]'::jsonb
  ) AS roles`;

export async function findUserById(
  connection: DatabaseConnection,
  userId: string,
): Promise<UserRecord | null> {
  const result = await connection.query<UserRow>(
    `SELECT ${userSelection}
     FROM "user" u
     LEFT JOIN user_role ur ON ur.user_id = u.id
       AND ur.revoked_at IS NULL AND ur.valid_from <= now()
       AND (ur.valid_until IS NULL OR ur.valid_until > now())
     LEFT JOIN role r ON r.id = ur.role_id AND r.status = 'active' AND r.deleted_at IS NULL
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function listUsers(
  connection: DatabaseConnection,
  input: { status?: "active" | "disabled"; cursor?: string; limit: number },
): Promise<{ items: UserRecord[]; nextCursor: string | null }> {
  const result = await connection.query<UserRow>(
    `SELECT ${userSelection}
     FROM "user" u
     LEFT JOIN user_role ur ON ur.user_id = u.id
       AND ur.revoked_at IS NULL AND ur.valid_from <= now()
       AND (ur.valid_until IS NULL OR ur.valid_until > now())
     LEFT JOIN role r ON r.id = ur.role_id AND r.status = 'active' AND r.deleted_at IS NULL
     WHERE ($1::user_status IS NULL OR u.status = $1)
       AND ($2::uuid IS NULL OR u.id > $2)
     GROUP BY u.id
     ORDER BY u.id
     LIMIT $3`,
    [input.status ?? null, input.cursor ?? null, input.limit + 1],
  );
  const hasNext = result.rows.length > input.limit;
  const rows = result.rows.slice(0, input.limit);
  return {
    items: rows.map(mapUser),
    nextCursor: hasNext ? (rows.at(-1)?.id ?? null) : null,
  };
}

export async function insertUser(
  connection: DatabaseConnection,
  input: { email: string; name: string },
): Promise<UserRecord> {
  const inserted = await connection.query<{ id: string }>(
    `INSERT INTO "user" (email, name, email_verified, status)
     VALUES ($1, $2, false, 'active') RETURNING id`,
    [input.email.trim().toLowerCase(), input.name.trim()],
  );
  return (await findUserById(connection, inserted.rows[0]!.id))!;
}

export async function updateUser(
  connection: DatabaseConnection,
  input: {
    userId: string;
    version: number;
    name?: string;
    status?: "active" | "disabled";
  },
): Promise<UserRecord | null> {
  const updated = await connection.query<{ id: string }>(
    `UPDATE "user"
     SET name = COALESCE($3, name),
         status = COALESCE($4::user_status, status),
         deactivated_at = CASE
           WHEN $4::user_status = 'disabled' THEN COALESCE(deactivated_at, now())
           WHEN $4::user_status = 'active' THEN NULL
           ELSE deactivated_at
         END,
         version = version + 1,
         updated_at = now()
     WHERE id = $1 AND version = $2
     RETURNING id`,
    [input.userId, input.version, input.name?.trim() || null, input.status ?? null],
  );
  return updated.rows[0] ? findUserById(connection, updated.rows[0].id) : null;
}

export async function revokeUserSessions(
  connection: DatabaseConnection,
  userId: string,
): Promise<number> {
  const result = await connection.query(
    "UPDATE session SET revoked_at = now(), updated_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId],
  );
  return result.rowCount ?? 0;
}
