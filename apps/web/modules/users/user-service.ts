import "server-only";
import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { writeSecurityEvent } from "@caab/db/repositories/security-events";
import { findRoleById } from "@caab/db/repositories/roles";
import {
  hasActiveAdministrativeRole,
  insertUserRole,
  lockAndCountActiveAdministrators,
} from "@caab/db/repositories/user-roles";
import {
  findUserById,
  insertUser,
  revokeUserSessions,
  updateUser,
  type UserRecord,
} from "@caab/db/repositories/users";
import { requirePermission } from "../auth/authorize";
import { PERMISSIONS } from "../auth/permissions";
import type { RequestActor } from "../shared/request-context";
import { validateRoleGrant } from "./access-policy";
import { UserAccessError } from "./errors";

interface CommandContext {
  actor: RequestActor;
  effectiveIdentity: string;
  requestId: string;
  correlationId: string;
}

interface ServiceDependencies {
  writeAudit?: typeof writeAuditEvent;
  writeSecurity?: typeof writeSecurityEvent;
}

function dependencies(overrides: ServiceDependencies) {
  return {
    writeAudit: overrides.writeAudit ?? writeAuditEvent,
    writeSecurity: overrides.writeSecurity ?? writeSecurityEvent,
  };
}

export function serializeUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled,
    roles: user.roles,
    version: user.version,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt?.toISOString() ?? null,
  };
}

export async function createUser(
  pool: Pool,
  command: CommandContext & {
    email: string;
    name: string;
    roleIds: string[];
    justification: string;
    idempotencyKey?: string;
  },
  overrides: ServiceDependencies = {},
) {
  requirePermission(command.actor, PERMISSIONS.usersCreate);
  const reason = command.justification.trim();
  if (!reason) throw new UserAccessError("JUSTIFICATION_REQUIRED", 422, "Justification required");
  const deps = dependencies(overrides);
  try {
    return await withTransaction(pool, async (client) => {
      const fingerprint = createHash("sha256")
        .update(
          JSON.stringify({
            email: command.email.trim().toLowerCase(),
            name: command.name.trim(),
            roleIds: [...command.roleIds].sort(),
          }),
        )
        .digest("hex");
      if (command.idempotencyKey) {
        const claimed = await client.query(
          `INSERT INTO idempotency_record
            (scope, key, request_fingerprint, expires_at)
           VALUES ('users:create', $1, $2, now() + interval '24 hours')
           ON CONFLICT DO NOTHING`,
          [command.idempotencyKey, fingerprint],
        );
        if (claimed.rowCount === 0) {
          const existing = await client.query<{
            request_fingerprint: string;
            status: "processing" | "completed" | "failed";
            response_reference: string | null;
          }>(
            `SELECT request_fingerprint, status, response_reference
             FROM idempotency_record WHERE scope = 'users:create' AND key = $1 FOR UPDATE`,
            [command.idempotencyKey],
          );
          const record = existing.rows[0]!;
          if (record.request_fingerprint !== fingerprint) {
            throw new UserAccessError(
              "IDEMPOTENCY_CONFLICT",
              409,
              "Idempotency key was used with a different request",
            );
          }
          if (record.status === "completed" && record.response_reference) {
            const prior = await findUserById(client, record.response_reference);
            if (prior) return serializeUser(prior);
          }
          throw new UserAccessError(
            "IDEMPOTENCY_IN_PROGRESS",
            409,
            "An equivalent request is still processing",
          );
        }
      }
      const created = await insertUser(client, { email: command.email, name: command.name });
      for (const roleId of command.roleIds) {
        const role = await findRoleById(client, roleId);
        if (!role || role.status !== "active") {
          throw new UserAccessError("ROLE_NOT_FOUND", 404, "Role not found");
        }
        const policy = validateRoleGrant({
          actor: command.actor,
          targetUserId: created.id,
          rolePermissions: role.permissions,
          roleAdministrative: role.administrative,
          justification: reason,
        });
        if (role.administrative) {
          throw new UserAccessError(
            "TARGET_MFA_REQUIRED",
            409,
            "MFA enrollment is required before administrative assignment",
          );
        }
        await insertUserRole(client, {
          userId: created.id,
          roleId,
          grantedBy: command.actor.userId,
          ...policy,
        });
      }
      const result = (await findUserById(client, created.id))!;
      await deps.writeAudit(client, {
        actorUserId: command.actor.userId,
        effectiveIdentity: command.effectiveIdentity,
        action: "user.created",
        entityType: "user",
        entityId: created.id,
        after: { name: result.name, status: result.status, roleIds: command.roleIds },
        reason,
        origin: "web",
        requestId: command.requestId,
        correlationId: command.correlationId,
      });
      await deps.writeSecurity(client, {
        userId: created.id,
        eventType: "account_change",
        outcome: "success",
        reasonCode: "ACCOUNT_CREATED",
        requestId: command.requestId,
        correlationId: command.correlationId,
        context: { actorUserId: command.actor.userId },
      });
      if (command.idempotencyKey) {
        await client.query(
          `UPDATE idempotency_record
           SET status = 'completed', response_reference = $2, updated_at = now()
           WHERE scope = 'users:create' AND key = $1`,
          [command.idempotencyKey, created.id],
        );
      }
      return serializeUser(result);
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      throw new UserAccessError("USER_EMAIL_CONFLICT", 409, "Email already exists");
    }
    throw error;
  }
}

export async function changeUser(
  pool: Pool,
  command: CommandContext & {
    userId: string;
    version: number;
    name?: string;
    status?: "active" | "disabled";
    justification: string;
  },
  overrides: ServiceDependencies = {},
) {
  requirePermission(
    command.actor,
    command.status === "disabled" ? PERMISSIONS.usersDisable : PERMISSIONS.usersUpdate,
  );
  const reason = command.justification.trim();
  if (!reason) throw new UserAccessError("JUSTIFICATION_REQUIRED", 422, "Justification required");
  const deps = dependencies(overrides);
  return withTransaction(pool, async (client: PoolClient) => {
    const before = await findUserById(client, command.userId);
    if (!before) throw new UserAccessError("USER_NOT_FOUND", 404, "User not found");
    if (
      command.status === "disabled" &&
      (await hasActiveAdministrativeRole(client, before.id)) &&
      (await lockAndCountActiveAdministrators(client)) <= 1
    ) {
      throw new UserAccessError(
        "LAST_ADMINISTRATOR",
        409,
        "The last active administrator cannot be disabled",
      );
    }
    const updated = await updateUser(client, command);
    if (!updated) {
      throw new UserAccessError("USER_VERSION_CONFLICT", 409, "User version changed");
    }
    const revokedSessions =
      command.status === "disabled" ? await revokeUserSessions(client, command.userId) : 0;
    await deps.writeAudit(client, {
      actorUserId: command.actor.userId,
      effectiveIdentity: command.effectiveIdentity,
      action: command.status === "disabled" ? "user.disabled" : "user.updated",
      entityType: "user",
      entityId: updated.id,
      before: { name: before.name, status: before.status, version: before.version },
      after: { name: updated.name, status: updated.status, version: updated.version },
      reason,
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    await deps.writeSecurity(client, {
      userId: updated.id,
      eventType: "account_change",
      outcome: "success",
      reasonCode: command.status === "disabled" ? "ACCOUNT_DISABLED" : "ACCOUNT_UPDATED",
      requestId: command.requestId,
      correlationId: command.correlationId,
      context: { actorUserId: command.actor.userId, revokedSessions },
    });
    return serializeUser(updated);
  });
}
