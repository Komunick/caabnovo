import "server-only";
import type { Pool, PoolClient } from "pg";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { writeSecurityEvent } from "@caab/db/repositories/security-events";
import { findRoleById } from "@caab/db/repositories/roles";
import {
  findActiveUserRole,
  insertUserRole,
  lockAndCountActiveAdministrators,
  revokeUserRole,
} from "@caab/db/repositories/user-roles";
import { findUserById } from "@caab/db/repositories/users";
import type { RequestActor } from "../shared/request-context";
import { validateRoleGrant, validateRoleRevocation } from "./access-policy";
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

export async function grantRole(
  pool: Pool,
  command: CommandContext & {
    targetUserId: string;
    roleId: string;
    justification: string;
    validUntil?: Date | null;
  },
  overrides: ServiceDependencies = {},
): Promise<void> {
  const deps = dependencies(overrides);
  try {
    await withTransaction(pool, async (client) => {
      const [target, role] = await Promise.all([
        findUserById(client, command.targetUserId),
        findRoleById(client, command.roleId),
      ]);
      if (!target || target.status !== "active") {
        throw new UserAccessError("USER_NOT_FOUND", 404, "User not found");
      }
      if (!role || role.status !== "active") {
        throw new UserAccessError("ROLE_NOT_FOUND", 404, "Role not found");
      }

      const policy = validateRoleGrant({
        actor: command.actor,
        targetUserId: target.id,
        rolePermissions: role.permissions,
        roleAdministrative: role.administrative,
        justification: command.justification,
        validUntil: command.validUntil,
      });
      if (await findActiveUserRole(client, target.id, role.id)) {
        throw new UserAccessError("ROLE_ALREADY_ASSIGNED", 409, "Role is already assigned");
      }
      await insertUserRole(client, {
        userId: target.id,
        roleId: role.id,
        grantedBy: command.actor.userId,
        ...policy,
      });
      await deps.writeAudit(client, {
        actorUserId: command.actor.userId,
        effectiveIdentity: command.effectiveIdentity,
        action: "user.role.granted",
        entityType: "user",
        entityId: target.id,
        before: { roleId: role.id, assigned: false },
        after: { roleId: role.id, assigned: true, validUntil: policy.validUntil?.toISOString() },
        reason: policy.justification,
        origin: "web",
        requestId: command.requestId,
        correlationId: command.correlationId,
      });
      await deps.writeSecurity(client, {
        userId: target.id,
        eventType: "role_grant",
        outcome: "success",
        reasonCode: "ROLE_GRANTED",
        requestId: command.requestId,
        correlationId: command.correlationId,
        context: { actorUserId: command.actor.userId, roleId: role.id },
      });
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      throw new UserAccessError("ROLE_ALREADY_ASSIGNED", 409, "Role is already assigned");
    }
    throw error;
  }
}

export async function revokeRole(
  pool: Pool,
  command: CommandContext & {
    targetUserId: string;
    roleId: string;
    reason: string;
  },
  overrides: ServiceDependencies = {},
): Promise<void> {
  const deps = dependencies(overrides);
  await withTransaction(pool, async (client: PoolClient) => {
    const [target, role] = await Promise.all([
      findUserById(client, command.targetUserId),
      findRoleById(client, command.roleId),
    ]);
    if (!target) throw new UserAccessError("USER_NOT_FOUND", 404, "User not found");
    if (!role) throw new UserAccessError("ROLE_NOT_FOUND", 404, "Role not found");
    const policy = validateRoleRevocation({
      actor: command.actor,
      targetUserId: target.id,
      reason: command.reason,
    });
    const assignment = await findActiveUserRole(client, target.id, role.id);
    if (!assignment) {
      throw new UserAccessError("ROLE_NOT_ASSIGNED", 409, "Role is not actively assigned");
    }
    if (role.administrative && (await lockAndCountActiveAdministrators(client)) <= 1) {
      throw new UserAccessError(
        "LAST_ADMINISTRATOR",
        409,
        "The last active administrator cannot be removed",
      );
    }
    await revokeUserRole(client, {
      assignmentId: assignment.id,
      revokedBy: command.actor.userId,
      reason: policy.reason,
    });
    await deps.writeAudit(client, {
      actorUserId: command.actor.userId,
      effectiveIdentity: command.effectiveIdentity,
      action: "user.role.revoked",
      entityType: "user",
      entityId: target.id,
      before: { roleId: role.id, assigned: true },
      after: { roleId: role.id, assigned: false },
      reason: policy.reason,
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    await deps.writeSecurity(client, {
      userId: target.id,
      eventType: "role_revocation",
      outcome: "success",
      reasonCode: "ROLE_REVOKED",
      requestId: command.requestId,
      correlationId: command.correlationId,
      context: { actorUserId: command.actor.userId, roleId: role.id },
    });
  });
}
