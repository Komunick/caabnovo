import type { Pool, PoolClient } from "pg";

export async function readUserPermissions(connection: Pool | PoolClient, userId: string) {
  const result = await connection.query<{ permission: string }>(
    "SELECT permission FROM effective_user_permission WHERE user_id=$1 ORDER BY permission",
    [userId],
  );
  return result.rows.map(({ permission }) => permission);
}

export async function readUserAccess(connection: Pool | PoolClient, userId: string) {
  const result = await connection.query<{ version: number }>(
    "SELECT version FROM user_access WHERE user_id=$1",
    [userId],
  );
  return {
    version: result.rows[0]?.version ?? 0,
    permissions: await readUserPermissions(connection, userId),
  };
}
