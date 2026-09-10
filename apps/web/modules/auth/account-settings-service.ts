import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import type { Pool } from "pg";
import { withTransaction } from "@caab/db";
import { accountSettingsRequestSchema, type AccountSettingsRequest } from "@caab/contracts";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { writeSecurityEvent } from "@caab/db/repositories/security-events";
import type { RequestActor } from "../shared/request-context";

export class AccountSettingsError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}

export async function changeAccountSettings(
  pool: Pool,
  command: {
    actor: RequestActor;
    input: AccountSettingsRequest;
    requestId: string;
    sendEmail: (to: string, token: string) => Promise<void>;
  },
) {
  const input = accountSettingsRequestSchema.parse(command.input);
  try {
    const result = await withTransaction(pool, async (client) => {
      const {
        rows: [user],
      } = await client.query<{ id: string; name: string; email: string; version: number }>(
        `SELECT u.id,u.name,u.email,u.version FROM "user" u
         JOIN session s ON s.user_id=u.id WHERE u.id=$1 AND u.status='active'
         AND s.id=$2 AND s.revoked_at IS NULL AND s.expires_at>now() FOR UPDATE OF u,s`,
        [command.actor.userId, command.actor.sessionId],
      );
      if (!user) throw new AccountSettingsError("AUTHENTICATION_REQUIRED", 401);
      if ("version" in input && input.version !== user.version)
        throw new AccountSettingsError("VERSION_CONFLICT", 409);
      let action: string;
      let changed = false;
      if (input.action === "profile") {
        await client.query(
          'UPDATE "user" SET name=$2,version=version+1,updated_at=now() WHERE id=$1',
          [user.id, input.name],
        );
        action = "user.profile.updated";
        changed = true;
      } else if (input.action === "confirm-email") {
        const tokenHash = createHash("sha256").update(input.token).digest("hex");
        const {
          rows: [pending],
        } = await client.query<{ id: string; new_email: string }>(
          `SELECT id,new_email FROM account_email_change WHERE user_id=$1 AND token_hash=$2
           AND consumed_at IS NULL AND expires_at>now() FOR UPDATE`,
          [user.id, tokenHash],
        );
        if (!pending) throw new AccountSettingsError("EMAIL_LINK_INVALID", 409);
        await client.query(
          'UPDATE "user" SET email=$2,email_verified=true,version=version+1,updated_at=now() WHERE id=$1',
          [user.id, pending.new_email],
        );
        await client.query(
          "UPDATE account_email_change SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL",
          [user.id],
        );
        action = "user.email.changed";
        changed = true;
      } else {
        const {
          rows: [attempts],
        } = await client.query<{ count: number }>(
          `SELECT count(*)::int AS count FROM security_event WHERE user_id=$1
           AND reason_code='SETTINGS_PASSWORD_INVALID' AND occurred_at>now()-interval '15 minutes'`,
          [user.id],
        );
        if (attempts!.count >= 5) throw new AccountSettingsError("TOO_MANY_ATTEMPTS", 429);
        const {
          rows: [credential],
        } = await client.query<{ id: string; password: string | null }>(
          "SELECT id,password FROM account WHERE user_id=$1 AND provider_id='credential' FOR UPDATE",
          [user.id],
        );
        if (!credential?.password) throw new AccountSettingsError("EXTERNAL_CREDENTIAL", 409);
        if (
          !(await verifyPassword({ hash: credential.password, password: input.currentPassword }))
        ) {
          await writeSecurityEvent(client, {
            userId: user.id,
            eventType: "account_change",
            outcome: "denied",
            reasonCode: "SETTINGS_PASSWORD_INVALID",
            requestId: command.requestId,
            correlationId: command.requestId,
          });
          return new AccountSettingsError("INVALID_PASSWORD", 422);
        }
        if (input.action === "password") {
          if (input.newPassword !== input.confirmPassword)
            throw new AccountSettingsError("PASSWORD_MISMATCH", 422);
          if (input.newPassword === input.currentPassword)
            throw new AccountSettingsError("PASSWORD_UNCHANGED", 422);
          await client.query("UPDATE account SET password=$2,updated_at=now() WHERE id=$1", [
            credential.id,
            await hashPassword(input.newPassword),
          ]);
          await client.query('UPDATE "user" SET version=version+1,updated_at=now() WHERE id=$1', [
            user.id,
          ]);
          await client.query(
            "UPDATE account_email_change SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL",
            [user.id],
          );
          action = "user.password.changed";
          changed = true;
        } else {
          if (input.newEmail === user.email.toLowerCase())
            throw new AccountSettingsError("EMAIL_UNCHANGED", 422);
          const exists = await client.query('SELECT id FROM "user" WHERE email=$1', [
            input.newEmail,
          ]);
          if (exists.rowCount) throw new AccountSettingsError("EMAIL_UNAVAILABLE", 409);
          const recent = await client.query(
            "SELECT id FROM account_email_change WHERE user_id=$1 AND created_at>now()-interval '1 minute'",
            [user.id],
          );
          if (recent.rowCount) throw new AccountSettingsError("EMAIL_REQUEST_LIMIT", 429);
          const token = randomBytes(32).toString("hex");
          await client.query(
            "UPDATE account_email_change SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL",
            [user.id],
          );
          await client.query(
            "INSERT INTO account_email_change(user_id,new_email,token_hash,expires_at) VALUES ($1,$2,$3,now()+interval '30 minutes')",
            [user.id, input.newEmail, createHash("sha256").update(token).digest("hex")],
          );
          try {
            await command.sendEmail(input.newEmail, token);
          } catch {
            throw new AccountSettingsError("EMAIL_DELIVERY_FAILED", 503);
          }
          action = "user.email.change_requested";
        }
      }
      let revokedSessions = 0;
      if (input.action === "password" || input.action === "confirm-email") {
        // Previously issued password links and MFA login challenges must not survive
        // a change to the credentials that authorized them.
        await client.query("DELETE FROM verification WHERE value=$1", [user.id]);
        const revoked = await client.query("DELETE FROM session WHERE user_id=$1 AND id<>$2", [
          user.id,
          command.actor.sessionId,
        ]);
        revokedSessions = revoked.rowCount ?? 0;
      }
      await writeAuditEvent(client, {
        actorUserId: user.id,
        effectiveIdentity: `user:${user.id}`,
        action,
        entityType: "user",
        entityId: user.id,
        before: { version: user.version },
        after: { version: user.version + (changed ? 1 : 0), revokedSessions },
        reason: "Alteração solicitada pelo titular em Configurações",
        origin: "web",
        requestId: command.requestId,
        correlationId: command.requestId,
      });
      await writeSecurityEvent(client, {
        userId: user.id,
        eventType: "account_change",
        outcome: "success",
        reasonCode: input.action === "request-email" ? "EMAIL_CHANGE_REQUESTED" : "ACCOUNT_UPDATED",
        requestId: command.requestId,
        correlationId: command.requestId,
      });
      return { success: true, version: user.version + (changed ? 1 : 0) };
    });
    if (result instanceof AccountSettingsError) throw result;
    return result;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505")
      throw new AccountSettingsError("EMAIL_UNAVAILABLE", 409);
    throw error;
  }
}
