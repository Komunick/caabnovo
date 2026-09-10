import "server-only";
import type { Pool } from "pg";
import { apiError, currentUserSchema, type CurrentUser } from "@caab/contracts";
import { getAuth } from "./auth";
import { loadActiveSession } from "./session-dal";
import { getDatabase } from "../shared/database";

export type CurrentUserIdentity = CurrentUser;
export type CurrentUserResolver = (request: Request) => Promise<CurrentUserIdentity | null>;

interface CurrentUserRow {
  id: string;
  email: string;
  name: string;
  status: "active" | "disabled";
  two_factor_enabled: boolean;
  version: number;
  created_at: Date;
  updated_at: Date | null;
  roles: Array<{ id: string; code: string; name: string }> | null;
}

export async function loadCurrentUser(
  pool: Pool,
  userId: string,
): Promise<CurrentUserIdentity | null> {
  const result = await pool.query<CurrentUserRow>(
    `SELECT u.id, u.email::text, u.name, u.status, u.two_factor_enabled, u.version,
      u.created_at, u.updated_at,
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object('id', r.id, 'code', r.code, 'name', r.name))
          FILTER (WHERE r.id IS NOT NULL), '[]'::jsonb
      ) AS roles
     FROM "user" u
     LEFT JOIN user_role ur ON ur.user_id = u.id
       AND ur.revoked_at IS NULL AND ur.valid_from <= now()
       AND (ur.valid_until IS NULL OR ur.valid_until > now())
     LEFT JOIN role r ON r.id = ur.role_id AND r.status = 'active' AND r.deleted_at IS NULL
     WHERE u.id = $1 AND u.status = 'active'
     GROUP BY u.id`,
    [userId],
  );
  const row = result.rows[0];
  if (!row) return null;

  const permissions = await pool.query<{ permission: string }>(
    `SELECT DISTINCT p.resource || ':' || p.action AS permission
     FROM user_role ur
     JOIN role r ON r.id = ur.role_id AND r.status = 'active' AND r.deleted_at IS NULL
     JOIN role_permission rp ON rp.role_id = r.id
     JOIN permission p ON p.id = rp.permission_id
     WHERE ur.user_id = $1 AND ur.revoked_at IS NULL AND ur.valid_from <= now()
       AND (ur.valid_until IS NULL OR ur.valid_until > now())
     ORDER BY permission`,
    [userId],
  );

  return currentUserSchema.parse({
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    twoFactorEnabled: false,
    roles: row.roles ?? [],
    permissions: permissions.rows.map(({ permission }) => permission),
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at?.toISOString() ?? null,
  });
}

export async function resolveCurrentUser(request: Request): Promise<CurrentUserIdentity | null> {
  const authSession = await getAuth().api.getSession({ headers: request.headers });
  if (!authSession) return null;
  const database = getDatabase();
  const actor = await loadActiveSession(database.pool, authSession.session.token);
  if (!actor) return null;
  return loadCurrentUser(database.pool, actor.userId);
}

export function createCurrentUserRoute(resolveIdentity: CurrentUserResolver) {
  return async function GET(request: Request): Promise<Response> {
    const suppliedRequestId = request.headers.get("x-request-id");
    const requestId =
      suppliedRequestId && /^[0-9a-f-]{36}$/i.test(suppliedRequestId)
        ? suppliedRequestId
        : crypto.randomUUID();
    try {
      const identity = await resolveIdentity(request);
      if (!identity) {
        return Response.json(
          apiError("AUTHENTICATION_REQUIRED", "Authentication required", requestId),
          { status: 401 },
        );
      }
      return Response.json(currentUserSchema.parse(identity));
    } catch (error) {
      if (typeof error === "object" && error && "status" in error && error.status === 403) {
        return Response.json(apiError("PERMISSION_DENIED", "Permission denied", requestId), {
          status: 403,
        });
      }
      throw error;
    }
  };
}
