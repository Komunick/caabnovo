import "server-only";
import type { Pool } from "pg";
import { withTransaction } from "@caab/db";
import { userAccessChangeSchema, type UserAccessChange } from "@caab/contracts";
import { readUserAccess, readUserPermissions } from "@caab/db/repositories/user-access";
import {
  hasActiveAdministrativeRole,
  lockAndCountActiveAdministrators,
} from "@caab/db/repositories/user-roles";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import type { RequestActor } from "../shared/request-context";
import { UserAccessError } from "./errors";
import { AuthenticationRequiredError } from "../auth/authorize";

const adminPermissions = [
  "users:read",
  "users:create",
  "users:update",
  "users:disable",
  "roles:read",
  "roles:grant",
  "roles:revoke",
];
const sameSet = (a: readonly string[], b: readonly string[]) =>
  JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort());
function denied(code = "PERMISSION_DENIED", status: 401 | 403 | 404 | 409 = 403): never {
  if (status === 401) throw new AuthenticationRequiredError(code);
  throw new UserAccessError(code, status, code);
}

export async function changeUserAccess(
  pool: Pool,
  command: {
    actor: RequestActor;
    targetUserId: string;
    input: UserAccessChange;
    requestId: string;
    correlationId: string;
  },
  audit = writeAuditEvent,
) {
  const input = userAccessChangeSchema.parse(command.input);
  if (command.actor.userId === command.targetUserId) denied("SELF_ESCALATION_DENIED");
  return withTransaction(pool, async (client) => {
    // Serialize with existing last-administrator checks before locking either account.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('caab:last-administrator'))");
    await client.query('SELECT id FROM "user" WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [
      [command.actor.userId, command.targetUserId],
    ]);
    const session = await client.query(
      `SELECT s.id FROM session s JOIN "user" u ON u.id=s.user_id
       WHERE s.id=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>now()
         AND u.status='active' FOR SHARE OF s`,
      [command.actor.sessionId, command.actor.userId],
    );
    if (!session.rows.length) denied("AUTHENTICATION_REQUIRED", 401);
    const authority = new Set(await readUserPermissions(client, command.actor.userId));
    if (
      !authority.has("users:read") ||
      (!authority.has("roles:grant") && !authority.has("roles:revoke"))
    )
      denied();
    const target = await client.query('SELECT status FROM "user" WHERE id=$1', [
      command.targetUserId,
    ]);
    if (target.rows[0]?.status !== "active") denied("USER_NOT_FOUND", 404);
    const before = await readUserAccess(client, command.targetUserId);
    if (before.version !== input.version || !sameSet(before.permissions, input.expectedPermissions))
      denied("ACCESS_VERSION_CONFLICT", 409);
    const additions = input.permissions.filter((key) => !before.permissions.includes(key));
    const removals = before.permissions.filter(
      (key) => !input.permissions.includes(key as (typeof input.permissions)[number]),
    );
    if (additions.length && !authority.has("roles:grant")) denied("ROLE_GRANT_DENIED");
    if (removals.length && !authority.has("roles:revoke")) denied("ROLE_REVOKE_DENIED");
    if ([...additions, ...removals].some((key) => !authority.has(key)))
      denied("GRANT_BEYOND_AUTHORITY");
    if (
      (await hasActiveAdministrativeRole(client, command.targetUserId)) &&
      adminPermissions.every((key) => before.permissions.includes(key)) &&
      !adminPermissions.every((key) =>
        input.permissions.includes(key as (typeof input.permissions)[number]),
      ) &&
      (await lockAndCountActiveAdministrators(client)) <= 1
    )
      denied("LAST_ADMINISTRATOR", 409);
    const saved = await client.query<{ version: number }>(
      `INSERT INTO user_access(user_id,permissions,updated_by) VALUES ($1,$2,$3)
       ON CONFLICT(user_id) DO UPDATE SET permissions=EXCLUDED.permissions,
       version=user_access.version+1,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING version`,
      [command.targetUserId, [...input.permissions].sort(), command.actor.userId],
    );
    await audit(client, {
      actorUserId: command.actor.userId,
      effectiveIdentity: `user:${command.actor.userId}`,
      action: "user.access.updated",
      entityType: "user",
      entityId: command.targetUserId,
      before,
      after: { version: saved.rows[0]!.version, permissions: [...input.permissions].sort() },
      reason: input.justification,
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    return { version: saved.rows[0]!.version, permissions: [...input.permissions].sort() };
  });
}
