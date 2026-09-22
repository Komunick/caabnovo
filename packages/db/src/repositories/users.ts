import type { UserAddress } from "@caab/contracts";
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
  cpf: string | null;
  phone: string | null;
  address: UserAddress | null;
  status: "active" | "disabled";
  twoFactorEnabled: boolean;
  roles: RoleReferenceRecord[];
  version: number;
  createdAt: Date;
  updatedAt: Date | null;
  deactivatedAt: Date | null;
  deletionEffectiveAt?: Date | null;
  deletionReason?: string | null;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  address: UserAddress | null;
  status: "active" | "disabled";
  two_factor_enabled: boolean;
  roles: RoleReferenceRecord[] | null;
  version: number;
  created_at: Date;
  updated_at: Date | null;
  deactivated_at: Date | null;
  deletion_effective_at: Date | null;
  deletion_reason: string | null;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    cpf: row.cpf,
    phone: row.phone,
    address: row.address,
    status: row.status,
    twoFactorEnabled: false,
    roles: row.roles ?? [],
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
    deletionEffectiveAt: row.deletion_effective_at,
    deletionReason: row.deletion_reason,
  };
}

const userSelection = `u.id, u.email::text, u.name, u.status, u.two_factor_enabled, u.version,
  u.created_at, u.updated_at, u.deactivated_at, u.deletion_effective_at, u.cpf, u.phone, u.address,
  (SELECT a.reason FROM audit_event a WHERE a.entity_type='user' AND a.entity_id=u.id::text
    AND a.action='user.deletion.requested'
    AND (a.after->>'deletionEffectiveAt')::timestamptz=date_trunc('milliseconds',u.deletion_effective_at)
    ORDER BY a.occurred_at DESC,a.id DESC LIMIT 1) AS deletion_reason,
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
  input: {
    q?: string;
    status?: "active" | "disabled";
    cursor?: string;
    limit: number;
    deleted?: "excluded" | "pending" | "only" | "all";
    roleId?: string;
    createdFrom?: string;
    createdTo?: string;
  },
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
       AND ($4='all' OR ($4='only' AND u.deletion_effective_at<=clock_timestamp())
         OR ($4='pending' AND u.deletion_effective_at>clock_timestamp())
         OR ($4='excluded' AND (u.deletion_effective_at IS NULL OR u.deletion_effective_at>clock_timestamp())))
       AND ($5::text = '' OR u.name ILIKE $6 OR u.email::text ILIKE $6
         OR ($7::text IS NOT NULL AND u.cpf LIKE $7))
       AND ($8::text IS NULL OR ($8='none' AND NOT EXISTS (SELECT 1 FROM user_role fr JOIN role rr ON rr.id=fr.role_id
         WHERE fr.user_id=u.id AND fr.revoked_at IS NULL AND fr.valid_from<=now() AND (fr.valid_until IS NULL OR fr.valid_until>now()) AND rr.status='active' AND rr.deleted_at IS NULL))
         OR EXISTS (SELECT 1 FROM user_role fr JOIN role rr ON rr.id=fr.role_id WHERE fr.user_id=u.id AND fr.role_id::text=$8
           AND fr.revoked_at IS NULL AND fr.valid_from<=now() AND (fr.valid_until IS NULL OR fr.valid_until>now()) AND rr.status='active' AND rr.deleted_at IS NULL))
       AND ($9::date IS NULL OR u.created_at>=($9::date::timestamp AT TIME ZONE 'America/Bahia'))
       AND ($10::date IS NULL OR u.created_at<(($10::date+1)::timestamp AT TIME ZONE 'America/Bahia'))
     GROUP BY u.id
     ORDER BY u.id
     LIMIT $3`,
    [
      input.status ?? null,
      input.cursor ?? null,
      input.limit + 1,
      input.deleted ?? "excluded",
      input.q?.trim() ?? "",
      `%${(input.q?.trim() ?? "").replace(/[\\%_]/g, "\\$&")}%`,
      input.q && /\d/.test(input.q) && /^[\d. -]+$/.test(input.q)
        ? `%${input.q.replace(/\D/g, "")}%`
        : null,
      input.roleId ?? null,
      input.createdFrom ?? null,
      input.createdTo ?? null,
    ],
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
  input: { email: string; name: string; cpf: string; phone: string; address: UserAddress },
): Promise<UserRecord> {
  const inserted = await connection.query<{ id: string }>(
    `INSERT INTO "user" (email, name, email_verified, status, cpf, phone, address)
     VALUES ($1, $2, false, 'active', $3, $4, $5::jsonb) RETURNING id`,
    [
      input.email.trim().toLowerCase(),
      input.name.trim(),
      input.cpf,
      input.phone,
      JSON.stringify(input.address),
    ],
  );
  return (await findUserById(connection, inserted.rows[0]!.id))!;
}

export async function updateUser(
  connection: DatabaseConnection,
  input: {
    userId: string;
    version: number;
    name?: string;
    cpf?: string;
    phone?: string;
    address?: UserAddress;
    status?: "active" | "disabled";
  },
): Promise<UserRecord | null> {
  const updated = await connection.query<{ id: string }>(
    `UPDATE "user"
     SET name = COALESCE($3, name),
         status = COALESCE($4::user_status, status),
         cpf = COALESCE($5, cpf),
         phone = COALESCE($6, phone),
         address = COALESCE($7::jsonb, address),
         deactivated_at = CASE
           WHEN $4::user_status = 'disabled' THEN COALESCE(deactivated_at, now())
           WHEN $4::user_status = 'active' THEN NULL
           ELSE deactivated_at
         END,
         version = version + 1,
         updated_at = now()
     WHERE id = $1 AND version = $2
     RETURNING id`,
    [
      input.userId,
      input.version,
      input.name?.trim() || null,
      input.status ?? null,
      input.cpf ?? null,
      input.phone ?? null,
      input.address ? JSON.stringify(input.address) : null,
    ],
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
