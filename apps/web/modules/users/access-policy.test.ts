import { describe, expect, it } from "vitest";
import { AccessPolicyError, validateRoleGrant, validateRoleRevocation } from "./access-policy";

const now = new Date("2026-09-08T12:00:00.000Z");
const actor = {
  userId: crypto.randomUUID(),
  permissions: new Set(["roles:grant", "roles:revoke", "users:read"]),
  mfaVerified: true,
};

describe("access policy", () => {
  it("allows an authorized bounded grant and normalizes its justification", () => {
    expect(
      validateRoleGrant({
        actor,
        targetUserId: crypto.randomUUID(),
        rolePermissions: ["users:read"],
        roleAdministrative: false,
        justification: "  Mudança aprovada  ",
        validFrom: now,
        validUntil: new Date("2026-09-09T12:00:00.000Z"),
        now,
      }),
    ).toEqual({
      justification: "Mudança aprovada",
      validFrom: now,
      validUntil: new Date("2026-09-09T12:00:00.000Z"),
    });
  });

  it("rejects an expired or inverted validity window", () => {
    expect(() =>
      validateRoleGrant({
        actor,
        targetUserId: crypto.randomUUID(),
        rolePermissions: ["users:read"],
        roleAdministrative: false,
        justification: "Vigência inválida",
        validFrom: now,
        validUntil: now,
        now,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_VALIDITY" }));
  });

  it("prevents self-elevation and grants beyond the actor authority", () => {
    expect(() =>
      validateRoleGrant({
        actor,
        targetUserId: actor.userId,
        rolePermissions: ["users:read"],
        roleAdministrative: false,
        justification: "Autoatribuição",
        now,
      }),
    ).toThrowError(expect.objectContaining({ code: "SELF_ESCALATION_DENIED" }));

    expect(() =>
      validateRoleGrant({
        actor,
        targetUserId: crypto.randomUUID(),
        rolePermissions: ["audit:export"],
        roleAdministrative: false,
        justification: "Fora da autoridade",
        now,
      }),
    ).toThrowError(expect.objectContaining({ code: "GRANT_BEYOND_AUTHORITY" }));
  });

  it("allows authorized administrative grants without an authenticator", () => {
    expect(() =>
      validateRoleGrant({
        actor: { ...actor, mfaVerified: false },
        targetUserId: crypto.randomUUID(),
        rolePermissions: ["users:read"],
        roleAdministrative: true,
        justification: "Acesso administrativo",
        now,
      }),
    ).not.toThrow();
  });

  it("requires revocation authority and a non-empty reason", () => {
    expect(() =>
      validateRoleRevocation({
        actor: { ...actor, permissions: new Set(["roles:grant"]) },
        targetUserId: crypto.randomUUID(),
        reason: "Acesso encerrado",
      }),
    ).toThrowError(AccessPolicyError);

    expect(() =>
      validateRoleRevocation({
        actor,
        targetUserId: crypto.randomUUID(),
        reason: "   ",
      }),
    ).toThrowError(expect.objectContaining({ code: "JUSTIFICATION_REQUIRED" }));

    expect(
      validateRoleRevocation({
        actor,
        targetUserId: crypto.randomUUID(),
        reason: "  Responsabilidade encerrada  ",
      }),
    ).toEqual({ reason: "Responsabilidade encerrada" });
  });
});
