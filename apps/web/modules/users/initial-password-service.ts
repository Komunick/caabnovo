import "server-only";
import type { Pool, PoolClient } from "pg";
import { hashPassword } from "better-auth/crypto";
import { withTransaction } from "@caab/db";
import { readUserPermissions } from "@caab/db/repositories/user-access";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { writeSecurityEvent } from "@caab/db/repositories/security-events";
import type { RequestActor } from "../shared/request-context";
import { AuthenticationRequiredError, PermissionDeniedError } from "../auth/authorize";
import { UserAccessError } from "./errors";
import { generateInitialPassword } from "./initial-password";

/** Caller locks the user, or has just inserted it in this same transaction. */
export async function insertInitialCredential(client: PoolClient, userId: string) {
  const existing = await client.query<{ id: string; password: string | null }>(
    "SELECT id,password FROM account WHERE user_id=$1 AND provider_id='credential' FOR UPDATE",
    [userId],
  );
  if (existing.rows.length > 1 || existing.rows.some((row) => row.password !== null))
    throw new UserAccessError("PASSWORD_ALREADY_DEFINED", 409, "Password already defined");
  const initialPassword = generateInitialPassword();
  const hash = await hashPassword(initialPassword);
  if (existing.rows[0]) {
    await client.query("UPDATE account SET password=$2,updated_at=now() WHERE id=$1", [
      existing.rows[0].id,
      hash,
    ]);
  } else {
    await client.query(
      "INSERT INTO account(id,account_id,provider_id,user_id,password) VALUES ($1,$2,'credential',$3,$4)",
      [crypto.randomUUID(), userId, userId, hash],
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
