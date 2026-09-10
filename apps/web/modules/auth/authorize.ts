import "server-only";
import type { RequestActor } from "../shared/request-context";
import type { Permission } from "./permissions";

export class AuthenticationRequiredError extends Error {
  readonly status = 401;
}

export class PermissionDeniedError extends Error {
  readonly status = 403;
}

export function requirePermission(
  actor: RequestActor | undefined,
  permission: Permission,
): RequestActor {
  if (!actor) throw new AuthenticationRequiredError("Authentication required");
  if (!actor.permissions.has(permission)) throw new PermissionDeniedError("Permission denied");
  return actor;
}
