import { PERMISSIONS } from "../auth/permissions";
import { UserAccessError } from "./errors";

export class AccessPolicyError extends UserAccessError {
  constructor(code: string, status: 403 | 422, message: string) {
    super(code, status, message);
    this.name = "AccessPolicyError";
  }
}

interface PolicyActor {
  userId: string;
  permissions: ReadonlySet<string>;
  /** Deprecated compatibility field; ignored by the permission policy. */
  mfaVerified?: boolean;
}

export function validateRoleGrant(input: {
  actor: PolicyActor;
  targetUserId: string;
  rolePermissions: readonly string[];
  roleAdministrative: boolean;
  justification: string;
  validFrom?: Date;
  validUntil?: Date | null;
  now?: Date;
}) {
  if (!input.actor.permissions.has(PERMISSIONS.rolesGrant)) {
    throw new AccessPolicyError("ROLE_GRANT_DENIED", 403, "Role grant permission required");
  }
  if (input.actor.userId === input.targetUserId) {
    throw new AccessPolicyError("SELF_ESCALATION_DENIED", 403, "Self-assignment is not allowed");
  }
  const outsideAuthority = input.rolePermissions.some(
    (permission) => !input.actor.permissions.has(permission),
  );
  if (outsideAuthority) {
    throw new AccessPolicyError(
      "GRANT_BEYOND_AUTHORITY",
      403,
      "The actor cannot grant permissions outside their authority",
    );
  }

  const justification = input.justification.trim();
  if (!justification) {
    throw new AccessPolicyError("JUSTIFICATION_REQUIRED", 422, "Justification is required");
  }
  const now = input.now ?? new Date();
  const validFrom = input.validFrom ?? now;
  const validUntil = input.validUntil ?? null;
  if (validUntil && (validUntil <= validFrom || validUntil <= now)) {
    throw new AccessPolicyError("INVALID_VALIDITY", 422, "Validity must end in the future");
  }
  return { justification, validFrom, validUntil };
}

export function validateRoleRevocation(input: {
  actor: PolicyActor;
  targetUserId: string;
  reason: string;
}) {
  if (!input.actor.permissions.has(PERMISSIONS.rolesRevoke)) {
    throw new AccessPolicyError("ROLE_REVOKE_DENIED", 403, "Role revoke permission required");
  }
  const reason = input.reason.trim();
  if (!reason) {
    throw new AccessPolicyError("JUSTIFICATION_REQUIRED", 422, "Revocation reason is required");
  }
  return { reason };
}
