import "server-only";
import type { Pool, PoolClient } from "pg";
import { hashPassword } from "better-auth/crypto";
import { createLocalAccountIssuer } from "better-auth/db";
import { withTransaction } from "@caab/db";
import { readRoleBase } from "@caab/db/repositories/user-roles";
import { readUserPermissions } from "@caab/db/repositories/user-access";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { writeSecurityEvent } from "@caab/db/repositories/security-events";
import type { RequestActor } from "../shared/request-context";
import { AuthenticationRequiredError, PermissionDeniedError } from "../auth/authorize";
import { UserAccessError } from "./errors";
import { currentAuthority } from "./current-authority";
import { PERMISSIONS } from "../auth/permissions";
import { generateInitialPassword } from "./initial-password";

/** Caller locks the user, or has just inserted it in this same transaction. */
export async function insertInitialCredential(client: PoolClient, userId: string) {
  return writeCredential(client, userId, false);
}
async function writeCredential(client: PoolClient, userId: string, replace: boolean) {
  const existing = await client.query<{ id: string; password: string | null }>(
    "SELECT id,password FROM account WHERE user_id=$1 AND provider_id='credential' FOR UPDATE",
    [userId],
  );
  if (existing.rows.length > 1 || (!replace && existing.rows.some((row) => row.password !== null)))
    throw new UserAccessError("PASSWORD_ALREADY_DEFINED", 409, "Password already defined");
  const initialPassword = generateInitialPassword();
  const hash = await hashPassword(initialPassword);
  const issuer = createLocalAccountIssuer("credential");
  if (existing.rows[0]) {
    await client.query(
      "UPDATE account SET password=$2,issuer=$3,account_id=$4,updated_at=now() WHERE id=$1",
      [existing.rows[0].id, hash, issuer, userId],
    );
  } else {
    await client.query(
      "INSERT INTO account(id,account_id,provider_id,user_id,password,issuer) VALUES ($1,$2,'credential',$3,$4,$5)",
      [crypto.randomUUID(), userId, userId, hash, issuer],
    );
  }
  return initialPassword;
}

export async function hasUserPassword(pool: Pool, userId: string): Promise<boolean> {
  const result = await pool.query<{ present: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM account WHERE user_id=$1 AND provider_id='credential' AND password IS NOT NULL) AS present",
    [userId],
  );
  return result.rows[0]!.present;
}

export const INITIAL_PASSWORD_PERMISSIONS = ["users:create", "users:update", "roles:grant"];

export async function initializeUserPassword(
  pool: Pool,
  command: { actor: RequestActor; userId: string; requestId: string; correlationId: string },
  audit = writeAuditEvent,
) {
  if (command.actor.userId === command.userId)
    throw new PermissionDeniedError("Self initialization denied");
  return withTransaction(pool, async (client) => {
    // Same ordering as permission management; serializes role/access changes too.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('caab:last-administrator'))");
    await client.query('SELECT id FROM "user" WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [
      [command.actor.userId, command.userId],
    ]);
    const session = await client.query(
      `SELECT s.id FROM session s JOIN "user" u ON u.id=s.user_id
       WHERE s.id=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>now()
         AND u.status='active' FOR SHARE OF s`,
      [command.actor.sessionId, command.actor.userId],
    );
    if (!session.rowCount) throw new AuthenticationRequiredError("Authentication required");
    const authority = new Set(await readUserPermissions(client, command.actor.userId));
    if (INITIAL_PASSWORD_PERMISSIONS.some((permission) => !authority.has(permission)))
      throw new PermissionDeniedError("Permission denied");
    const target = await client.query("SELECT id FROM \"user\" WHERE id=$1 AND status='active'", [
      command.userId,
    ]);
    if (!target.rowCount) throw new UserAccessError("USER_NOT_FOUND", 404, "User not found");
    const permissions = await readUserPermissions(client, command.userId);
    if (permissions.some((permission) => !authority.has(permission)))
      throw new PermissionDeniedError("Target is outside current authority");
    const initialPassword = await insertInitialCredential(client, command.userId);
    await client.query("DELETE FROM session WHERE user_id=$1", [command.userId]);
    await client.query("DELETE FROM verification WHERE value=$1", [command.userId]);
    await audit(client, {
      actorUserId: command.actor.userId,
      effectiveIdentity: `user:${command.actor.userId}`,
      action: "user.password.initialized",
      entityType: "user",
      entityId: command.userId,
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    await writeSecurityEvent(client, {
      userId: command.userId,
      eventType: "account_change",
      outcome: "success",
      reasonCode: "INITIAL_PASSWORD_CREATED",
      requestId: command.requestId,
      correlationId: command.correlationId,
      context: { actorUserId: command.actor.userId },
    });
    return { initialPassword };
  });
}

/** Replacement is separate from first initialization; stale versions can never rotate twice. */
export async function resetUserPassword(
  pool: Pool,
  command: {
    actor: RequestActor;
    userId: string;
    version: number;
    requestId: string;
    correlationId: string;
  },
  audit = writeAuditEvent,
) {
  if (command.actor.userId === command.userId)
    throw new PermissionDeniedError("Use personal password settings");
  return withTransaction(pool, async (client) => {
    const actor = await currentAuthority(
      client,
      command.actor,
      PERMISSIONS.usersResetPassword,
      command.userId,
    );
    const role = await readRoleBase(client, actor.userId);
    const targetRole = await readRoleBase(client, command.userId);
    if ((!role.administrator && !role.manager) || (!role.administrator && targetRole.administrator))
      throw new PermissionDeniedError("Password replacement exceeds role authority");
    const target = await client.query<{ version: number }>(
      `SELECT version FROM "user" WHERE id=$1 AND status='active'`,
      [command.userId],
    );
    if (!target.rows[0]) throw new UserAccessError("USER_NOT_FOUND", 404, "User not found");
    if (target.rows[0].version !== command.version)
      throw new UserAccessError("USER_VERSION_CONFLICT", 409, "User version changed");
    const initialPassword = await writeCredential(client, command.userId, true);
    const updated = await client.query<{ version: number }>(
      'UPDATE "user" SET version=version+1,updated_at=now() WHERE id=$1 RETURNING version',
      [command.userId],
    );
    await client.query("DELETE FROM session WHERE user_id=$1", [command.userId]);
    await client.query("DELETE FROM verification WHERE value=$1", [command.userId]);
    await audit(client, {
      actorUserId: actor.userId,
      effectiveIdentity: `user:${actor.userId}`,
      action: "user.password.reset",
      entityType: "user",
      entityId: command.userId,
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    await writeSecurityEvent(client, {
      userId: command.userId,
      eventType: "account_change",
      outcome: "success",
      reasonCode: "PASSWORD_RESET_BY_ADMINISTRATOR",
      requestId: command.requestId,
      correlationId: command.correlationId,
      context: { actorUserId: actor.userId },
    });
    return { initialPassword, version: updated.rows[0]!.version };
  });
}
