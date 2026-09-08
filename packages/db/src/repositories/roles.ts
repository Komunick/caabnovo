import type { Pool, PoolClient } from "pg";

type DatabaseConnection = Pool | PoolClient;

export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  administrative: boolean;
  status: "active" | "inactive";
  permissions: string[];
}

interface RoleRow {
  id: string;
  code: string;
  name: string;
  description: string;
  is_administrative: boolean;
  status: "active" | "inactive";
  permissions: string[] | null;
}

function mapRole(row: RoleRow): RoleRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    administrative: row.is_administrative,
    status: row.status,
    permissions: row.permissions ?? [],
  };
}

const roleSelection = `r.id, r.code, r.name, r.description, r.is_administrative, r.status,
  array_remove(array_agg(DISTINCT p.resource || ':' || p.action ORDER BY p.resource || ':' || p.action), NULL)
    AS permissions`;

export async function findRoleById(
  connection: DatabaseConnection,
  roleId: string,
): Promise<RoleRecord | null> {
  const result = await connection.query<RoleRow>(
    `SELECT ${roleSelection}
     FROM role r
     LEFT JOIN role_permission rp ON rp.role_id = r.id
     LEFT JOIN permission p ON p.id = rp.permission_id
     WHERE r.id = $1 AND r.deleted_at IS NULL
     GROUP BY r.id`,
    [roleId],
  );
  return result.rows[0] ? mapRole(result.rows[0]) : null;
}

export async function listActiveRoles(connection: DatabaseConnection): Promise<RoleRecord[]> {
  const result = await connection.query<RoleRow>(
    `SELECT ${roleSelection}
     FROM role r
     LEFT JOIN role_permission rp ON rp.role_id = r.id
     LEFT JOIN permission p ON p.id = rp.permission_id
     WHERE r.status = 'active' AND r.deleted_at IS NULL
     GROUP BY r.id
     ORDER BY r.name`,
  );
  return result.rows.map(mapRole);
}
