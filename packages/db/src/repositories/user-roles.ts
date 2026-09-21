import type { Pool, PoolClient } from "pg";

export async function readRoleBase(connection: Pool | PoolClient, userId: string) {
  const result = await connection.query<{ administrator: boolean; manager: boolean }>(
    `SELECT coalesce(bool_or(r.code='administrator'),false) AS administrator,
      coalesce(bool_or(r.code='manager'),false) AS manager
     FROM user_role ur JOIN role r ON r.id=ur.role_id
     JOIN "user" u ON u.id=ur.user_id AND u.status='active'
     WHERE ur.user_id=$1 AND r.status='active' AND r.deleted_at IS NULL
       AND ur.revoked_at IS NULL AND ur.valid_from<=clock_timestamp()
       AND (ur.valid_until IS NULL OR ur.valid_until>clock_timestamp())`,
    [userId],
  );
  const roles = result.rows[0]!;
  const base = await connection.query<{ permission: string }>(
    `SELECT resource||':'||action AS permission FROM permission
     WHERE $1 OR ($2 AND (action='read' OR resource='reports'
       OR (resource='messages' AND action='access')
       OR (resource='exports' AND action='generate')
       OR (resource='access' AND action='manage')
       OR (resource='users' AND action='reset-password'))) ORDER BY permission`,
    [roles.administrator, roles.manager],
  );
  return { ...roles, permissions: base.rows.map((row) => row.permission) };
}

export interface UserRoleRecord {
  id: string;
  userId: string;
  roleId: string;
  grantedBy: string;
  justification: string;
  validFrom: Date;
  validUntil: Date | null;
  revokedAt: Date | null;
}

interface UserRoleRow {
  id: string;
  user_id: string;
  role_id: string;
  granted_by: string;
  justification: string;
  valid_from: Date;
  valid_until: Date | null;
  revoked_at: Date | null;
}

function mapAssignment(row: UserRoleRow): UserRoleRecord {
  return {
    id: row.id,
    userId: row.user_id,
    roleId: row.role_id,
    grantedBy: row.granted_by,
    justification: row.justification,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    revokedAt: row.revoked_at,
  };
}

export async function findActiveUserRole(
  client: PoolClient,
  userId: string,
  roleId: string,
): Promise<UserRoleRecord | null> {
  const result = await client.query<UserRoleRow>(
    `SELECT id, user_id, role_id, granted_by, justification, valid_from, valid_until, revoked_at
     FROM user_role
     WHERE user_id = $1 AND role_id = $2 AND revoked_at IS NULL
     FOR UPDATE`,
    [userId, roleId],
  );
  return result.rows[0] ? mapAssignment(result.rows[0]) : null;
}

export async function insertUserRole(
  client: PoolClient,
  input: {
    userId: string;
    roleId: string;
    grantedBy: string;
    justification: string;
    validFrom: Date;
    validUntil: Date | null;
  },
): Promise<UserRoleRecord> {
  const result = await client.query<UserRoleRow>(
    `INSERT INTO user_role
      (user_id, role_id, granted_by, justification, valid_from, valid_until)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, role_id, granted_by, justification, valid_from, valid_until, revoked_at`,
    [
      input.userId,
      input.roleId,
      input.grantedBy,
      input.justification,
      input.validFrom,
      input.validUntil,
    ],
  );
  return mapAssignment(result.rows[0]!);
}

export async function revokeUserRole(
  client: PoolClient,
  input: { assignmentId: string; revokedBy: string; reason: string },
): Promise<void> {
  await client.query(
    `UPDATE user_role
     SET revoked_at = now(), revoked_by = $2, revocation_reason = $3
     WHERE id = $1 AND revoked_at IS NULL`,
    [input.assignmentId, input.revokedBy, input.reason],
  );
}

export async function lockAndCountActiveAdministrators(client: PoolClient): Promise<number> {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('caab:last-administrator'))");
  const result = await client.query<{ count: string }>(
    `SELECT count(DISTINCT ur.user_id)
     FROM user_role ur
     JOIN role r ON r.id = ur.role_id
     JOIN "user" u ON u.id = ur.user_id
     WHERE r.code='administrator' AND r.status = 'active' AND r.deleted_at IS NULL
       AND u.status = 'active'
       AND ur.revoked_at IS NULL AND ur.valid_from <= now()
       AND (ur.valid_until IS NULL OR ur.valid_until > now())`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function hasActiveAdministrativeRole(
  client: PoolClient,
  userId: string,
): Promise<boolean> {
  const result = await client.query<{ administrative: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM user_role ur
       JOIN role r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND r.code='administrator'
         AND r.status = 'active' AND r.deleted_at IS NULL
         AND ur.revoked_at IS NULL AND ur.valid_from <= now()
         AND (ur.valid_until IS NULL OR ur.valid_until > now())
     ) AS administrative`,
    [userId],
  );
  return result.rows[0]?.administrative ?? false;
}
