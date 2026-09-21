import "server-only";
import {
  createUserRequestSchema,
  updateUserRequestSchema,
  type UserAddress,
} from "@caab/contracts";
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
import { insertInitialCredential } from "./initial-password-service";
import { currentAuthority } from "./current-authority";

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
    cpf: user.cpf,
    phone: user.phone,
    address: user.address,
    status: user.status,
    twoFactorEnabled: user.twoFactorEnabled,
    roles: user.roles,
    version: user.version,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt?.toISOString() ?? null,
    deletionEffectiveAt: user.deletionEffectiveAt?.toISOString() ?? null,
  };
}

export async function createUser(
  pool: Pool,
  command: CommandContext & {
    email: string;
    name: string;
    cpf: string;
    phone: string;
    address: UserAddress;
    roleIds: string[];
    justification?: string;
    idempotencyKey?: string;
  },
  overrides: ServiceDependencies = {},
) {
  requirePermission(command.actor, PERMISSIONS.usersCreate);
  const input = createUserRequestSchema.parse({
    email: command.email,
    name: command.name,
    cpf: command.cpf,
    phone: command.phone,
    address: command.address,
    roleIds: command.roleIds,
    justification: command.justification,
  });
  const reason = command.justification?.trim() || "";
  const deps = dependencies(overrides);
  try {
    return await withTransaction(pool, async (client) => {
      const actor = await currentAuthority(client, command.actor, PERMISSIONS.usersCreate);
      if (command.roleIds.length) await currentAuthority(client, actor, PERMISSIONS.rolesGrant);
      const fingerprint = createHash("sha256")
        .update(
          JSON.stringify({
            email: command.email.trim().toLowerCase(),
            name: command.name.trim(),
            cpf: input.cpf,
            phone: input.phone,
            address: input.address,
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
            if (prior) return { ...serializeUser(prior), initialPassword: null };
          }
          throw new UserAccessError(
            "IDEMPOTENCY_IN_PROGRESS",
            409,
            "An equivalent request is still processing",
          );
        }
      }
      const created = await insertUser(client, input);
      const initialPassword = await insertInitialCredential(client, created.id);
      for (const roleId of command.roleIds) {
        const role = await findRoleById(client, roleId);
        if (!role || role.status !== "active") {
          throw new UserAccessError("ROLE_NOT_FOUND", 404, "Role not found");
        }
        const policy = validateRoleGrant({
          actor,
          targetUserId: created.id,
          rolePermissions: role.permissions,
          roleAdministrative: role.administrative,
          // Initial access starts at creation, using the same database transaction clock.
          now: created.createdAt,
          justification: reason,
        });

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
      return { ...serializeUser(result), initialPassword };
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      if ("constraint" in error && error.constraint === "user_cpf_unique")
        throw new UserAccessError("USER_CPF_CONFLICT", 409, "CPF already exists");
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
    cpf?: string;
    phone?: string;
    address?: UserAddress;
    status?: "active" | "disabled";
    justification: string;
  },
  overrides: ServiceDependencies = {},
) {
  requirePermission(
    command.actor,
    command.status === "disabled" ? PERMISSIONS.usersDisable : PERMISSIONS.usersUpdate,
  );
  const changesProfile = [command.name, command.cpf, command.phone, command.address].some(
    (value) => value !== undefined,
  );
  if (changesProfile) requirePermission(command.actor, PERMISSIONS.usersUpdate);
  const input = updateUserRequestSchema.parse({
    name: command.name,
    status: command.status,
    cpf: command.cpf,
    phone: command.phone,
    address: command.address,
    version: command.version,
    justification: command.justification,
  });
  const reason = command.justification.trim();
  const deps = dependencies(overrides);
  return withTransaction(pool, async (client: PoolClient) => {
    await currentAuthority(
      client,
      command.actor,
      command.status === "disabled" ? PERMISSIONS.usersDisable : PERMISSIONS.usersUpdate,
      command.userId,
    );
    if (changesProfile)
      await currentAuthority(client, command.actor, PERMISSIONS.usersUpdate, command.userId);
    const before = await findUserById(client, command.userId);
    if (!before) throw new UserAccessError("USER_NOT_FOUND", 404, "User not found");
    if (before.deletionEffectiveAt)
      throw new UserAccessError(
        "USER_DELETION_PENDING",
        409,
        "Restore the account explicitly first",
      );
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
    const updated = await updateUser(client, { ...input, userId: command.userId });
    if (!updated) {
      throw new UserAccessError("USER_VERSION_CONFLICT", 409, "User version changed");
    }
    const revokedSessions =
      command.status === "disabled" ? await revokeUserSessions(client, command.userId) : 0;
    await deps.writeAudit(client, {
      actorUserId: command.actor.userId,
      effectiveIdentity: command.effectiveIdentity,
      action:
        command.status === "disabled"
          ? "user.disabled"
          : command.status === "active" && before.status === "disabled"
            ? "user.reactivated"
            : "user.updated",
      entityType: "user",
      entityId: updated.id,
      before: { name: before.name, status: before.status, version: before.version },
      after: {
        name: updated.name,
        status: updated.status,
        version: updated.version,
        changedFields: ["cpf", "phone", "address"].filter(
          (field) => input[field as keyof typeof input] !== undefined,
        ),
      },
      reason,
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    await deps.writeSecurity(client, {
      userId: updated.id,
      eventType: "account_change",
      outcome: "success",
      reasonCode:
        command.status === "disabled"
          ? "ACCOUNT_DISABLED"
          : command.status === "active" && before.status === "disabled"
            ? "ACCOUNT_REACTIVATED"
            : "ACCOUNT_UPDATED",
      requestId: command.requestId,
      correlationId: command.correlationId,
      context: { actorUserId: command.actor.userId, revokedSessions },
    });
    return serializeUser(updated);
  }).catch((error: unknown) => {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505" &&
      "constraint" in error &&
      error.constraint === "user_cpf_unique"
    )
      throw new UserAccessError("USER_CPF_CONFLICT", 409, "CPF already exists");
    throw error;
  });
}

export async function changeUserLifecycle(
  pool: Pool,
  command: CommandContext & { userId: string; version: number; action: "delete" | "restore" },
  overrides: ServiceDependencies = {},
) {
  const deps = dependencies(overrides);
  return withTransaction(pool, async (client) => {
    await currentAuthority(
      client,
      command.actor,
      command.action === "delete" ? PERMISSIONS.usersDelete : PERMISSIONS.usersUpdate,
      command.userId,
    );
    const before = await findUserById(client, command.userId);
    if (!before) throw new UserAccessError("USER_NOT_FOUND", 404, "User not found");
    if (before.version !== command.version)
      throw new UserAccessError("USER_VERSION_CONFLICT", 409, "User version changed");
    if (command.action === "delete") {
      if (before.deletionEffectiveAt)
        throw new UserAccessError("USER_DELETION_PENDING", 409, "Deletion already requested");
      if (
        (await hasActiveAdministrativeRole(client, before.id)) &&
        (await lockAndCountActiveAdministrators(client)) <= 1
      )
        throw new UserAccessError(
          "LAST_ADMINISTRATOR",
          409,
          "Last administrator must remain active",
        );
      await client.query(
        `UPDATE "user" SET status='disabled',deactivated_at=coalesce(deactivated_at,now()),deletion_effective_at=clock_timestamp()+interval '24 hours',version=version+1,updated_at=now() WHERE id=$1`,
        [before.id],
      );
      await revokeUserSessions(client, before.id);
      await client.query("DELETE FROM verification WHERE value=$1", [before.id]);
    } else {
      if (!before.deletionEffectiveAt)
        throw new UserAccessError("USER_NOT_DELETED", 409, "Deletion not requested");
      // Restoration is explicit; old sessions remain revoked and existing grants remain auditable.
      await client.query(
        `UPDATE "user" SET status='active',deactivated_at=NULL,deletion_effective_at=NULL,version=version+1,updated_at=now() WHERE id=$1`,
        [before.id],
      );
    }
    const updated = (await findUserById(client, before.id))!;
    await deps.writeAudit(client, {
      actorUserId: command.actor.userId,
      effectiveIdentity: command.effectiveIdentity,
      action: command.action === "delete" ? "user.deletion.requested" : "user.deletion.restored",
      entityType: "user",
      entityId: before.id,
      before: {
        status: before.status,
        deletionEffectiveAt: before.deletionEffectiveAt?.toISOString() ?? null,
      },
      after: {
        status: updated.status,
        deletionEffectiveAt: updated.deletionEffectiveAt?.toISOString() ?? null,
      },
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    await deps.writeSecurity(client, {
      userId: before.id,
      eventType: "account_change",
      outcome: "success",
      reasonCode: command.action === "delete" ? "ACCOUNT_DELETION_REQUESTED" : "ACCOUNT_RESTORED",
      requestId: command.requestId,
      correlationId: command.correlationId,
      context: { actorUserId: command.actor.userId },
    });
    return serializeUser(updated);
  });
}
