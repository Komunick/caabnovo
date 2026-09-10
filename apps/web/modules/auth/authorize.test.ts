import { describe, expect, it } from "vitest";
import type { RequestActor } from "../shared/request-context";
import { AuthenticationRequiredError, PermissionDeniedError, requirePermission } from "./authorize";
import { composePermissions, PERMISSIONS } from "./permissions";

function actor(permissions: ReadonlySet<string>, mfaVerified = false): RequestActor {
  return {
    userId: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
    permissions,
    mfaVerified,
  };
}

describe("requirePermission", () => {
  it("denies unauthenticated and unauthorized access by default", () => {
    expect(() => requirePermission(undefined, PERMISSIONS.usersRead)).toThrow(
      AuthenticationRequiredError,
    );
    expect(() => requirePermission(actor(new Set()), PERMISSIONS.usersRead)).toThrow(
      PermissionDeniedError,
    );
  });

  it("allows only a concrete permission present in the current actor", () => {
    const current = actor(new Set([PERMISSIONS.usersRead]));

    expect(requirePermission(current, PERMISSIONS.usersRead)).toBe(current);
    expect(() => requirePermission(current, PERMISSIONS.usersCreate)).toThrow(
      PermissionDeniedError,
    );
  });

  it("authorizes administrative actions by permission without an authenticator", () => {
    const permissions = new Set([PERMISSIONS.rolesGrant]);

    expect(requirePermission(actor(permissions), PERMISSIONS.rolesGrant)).toBeTruthy();
  });
});

describe("composePermissions", () => {
  it("unions active role permissions and removes unknown permission identifiers", () => {
    expect(
      composePermissions([
        [PERMISSIONS.usersRead, PERMISSIONS.rolesRead],
        [PERMISSIONS.usersRead, "unknown:bypass"],
      ]),
    ).toEqual(new Set([PERMISSIONS.usersRead, PERMISSIONS.rolesRead]));
  });
});
