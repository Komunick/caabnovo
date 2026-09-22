import "server-only";
import type { Pool, PoolClient } from "pg";
import { nextRoleCode } from "@caab/contracts";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { writeSecurityEvent } from "@caab/db/repositories/security-events";
import { findRoleById, listActiveRoles } from "@caab/db/repositories/roles";
import {
  findActiveUserRole,
  findOverlappingUserRole,
  insertUserRole,
  lockAndCountActiveAdministrators,
  revokeUserRole,
} from "@caab/db/repositories/user-roles";
import { findUserById } from "@caab/db/repositories/users";
import type { RequestActor } from "../shared/request-context";
import { validateRoleGrant, validateRoleRevocation } from "./access-policy";
import { UserAccessError } from "./errors";
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
      const actor = await currentAuthority(
        client,
        command.actor,
        "roles:grant",
        command.targetUserId,
      );
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
        actor,
        targetUserId: target.id,
        rolePermissions: role.permissions,
        roleAdministrative: role.administrative,
        justification: command.justification,
        validUntil: command.validUntil,
      });
      const existing = await findOverlappingUserRole(
        client,
        target.id,
        policy.validFrom,
        policy.validUntil,
      );
      if (existing) {
        throw new UserAccessError(
          existing.roleId === role.id ? "ROLE_ALREADY_ASSIGNED" : "USER_ROLE_CONFLICT",
          409,
          "User already has a role for this period",
        );
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
    if (typeof error === "object" && error && "code" in error && error.code === "23P01") {
      throw new UserAccessError(
        "USER_ROLE_CONFLICT",
        409,
        "User already has a role for this period",
      );
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
    const actor = await currentAuthority(
      client,
      command.actor,
      "roles:revoke",
      command.targetUserId,
    );
    const [target, role] = await Promise.all([
      findUserById(client, command.targetUserId),
      findRoleById(client, command.roleId),
    ]);
    if (!target) throw new UserAccessError("USER_NOT_FOUND", 404, "User not found");
    if (!role) throw new UserAccessError("ROLE_NOT_FOUND", 404, "Role not found");
    const policy = validateRoleRevocation({
      actor,
      targetUserId: target.id,
      reason: command.reason,
    });
    const assignment = await findActiveUserRole(client, target.id, role.id);
    if (!assignment) {
      throw new UserAccessError("ROLE_NOT_ASSIGNED", 409, "Role is not actively assigned");
    }
    if (role.code === "administrator" && (await lockAndCountActiveAdministrators(client)) <= 1) {
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

export async function promoteRole(
  pool: Pool,
  command: CommandContext & { targetUserId: string; roleId: string },
  overrides: ServiceDependencies = {},
): Promise<void> {
  const deps = dependencies(overrides);
  await withTransaction(pool, async (client) => {
    const actor = await currentAuthority(
      client,
      command.actor,
      "roles:grant",
      command.targetUserId,
    );
    validateRoleRevocation({ actor, targetUserId: command.targetUserId, reason: "" });
    const target = await findUserById(client, command.targetUserId);
    if (!target || target.status !== "active")
      throw new UserAccessError("USER_NOT_FOUND", 404, "User not found");
    const current = await findRoleById(client, command.roleId);
    if (!current || current.status !== "active")
      throw new UserAccessError("ROLE_NOT_FOUND", 404, "Role not found");
    const assignment = await findActiveUserRole(client, target.id, current.id);
    if (!assignment)
      throw new UserAccessError("ROLE_PROMOTION_CONFLICT", 409, "Current role changed or expired");
    const nextCode = nextRoleCode(current.code);
    if (!nextCode)
      throw new UserAccessError("ROLE_PROMOTION_UNAVAILABLE", 409, "Role has no successor");
    const next = (await listActiveRoles(client)).find((role) => role.code === nextCode);
    if (!next)
      throw new UserAccessError("ROLE_PROMOTION_UNAVAILABLE", 409, "Next role unavailable");
    const reason = `Promoção de ${current.name} para ${next.name}.`;
    const policy = validateRoleGrant({
      actor,
      targetUserId: target.id,
      rolePermissions: next.permissions,
      roleAdministrative: next.administrative,
      justification: reason,
      validUntil: assignment.validUntil,
    });
    await revokeUserRole(client, { assignmentId: assignment.id, revokedBy: actor.userId, reason });
    await insertUserRole(client, {
      userId: target.id,
      roleId: next.id,
      grantedBy: actor.userId,
      ...policy,
    });
    for (const [role, granted] of [
      [current, false],
      [next, true],
    ] as const) {
      await deps.writeAudit(client, {
        actorUserId: actor.userId,
        effectiveIdentity: command.effectiveIdentity,
        action: granted ? "user.role.granted" : "user.role.revoked",
        entityType: "user",
        entityId: target.id,
        before: { roleId: role.id, assigned: !granted },
        after: {
          roleId: role.id,
          assigned: granted,
          promotion: true,
          validUntil: assignment.validUntil?.toISOString(),
        },
        reason,
        origin: "web",
        requestId: command.requestId,
        correlationId: command.correlationId,
      });
      await deps.writeSecurity(client, {
        userId: target.id,
        eventType: granted ? "role_grant" : "role_revocation",
        outcome: "success",
        reasonCode: granted ? "ROLE_GRANTED" : "ROLE_REVOKED",
        requestId: command.requestId,
        correlationId: command.correlationId,
        context: { actorUserId: actor.userId, roleId: role.id, promotion: true },
      });
    }
  });
}
