import { describe, expect, it, vi } from "vitest";
import { createUserRequestSchema, updateUserRequestSchema, userPageSchema } from "@caab/contracts";
import { createUsersRoute } from "../../modules/users/http/users-route";

const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(["users:read", "users:create"]),
  mfaVerified: true,
};

describe("users contracts", () => {
  it("validates a paginated user response", () => {
    expect(
      userPageSchema.parse({
        items: [
          {
            id: crypto.randomUUID(),
            email: "managed@example.test",
            name: "Managed User",
            status: "active",
            twoFactorEnabled: false,
            roles: [],
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: null,
          },
        ],
        nextCursor: null,
      }).items,
    ).toHaveLength(1);
  });

  it("rejects duplicate roles and invalid optimistic versions", () => {
    const roleId = crypto.randomUUID();
    expect(
      createUserRequestSchema.safeParse({
        email: "managed@example.test",
        name: "Managed User",
        roleIds: [roleId, roleId],
        justification: "Conta aprovada",
      }).success,
    ).toBe(false);
    expect(
      updateUserRequestSchema.safeParse({ version: 0, justification: "Atualização" }).success,
    ).toBe(false);
  });

  it("maps validation failures to 422 and state conflicts to 409", async () => {
    const route = createUsersRoute({
      resolveActor: async () => actor,
      list: vi.fn(),
      create: async () => {
        throw Object.assign(new Error("duplicate email detail"), {
          code: "USER_EMAIL_CONFLICT",
          status: 409,
        });
      },
    });
    const invalid = await route.POST(
      new Request("https://caab.example.test/api/v1/users", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://caab.example.test",
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": "synthetic-request-0001",
        },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );
    expect(invalid.status).toBe(422);

    const conflict = await route.POST(
      new Request("https://caab.example.test/api/v1/users", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://caab.example.test",
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": "synthetic-request-0002",
        },
        body: JSON.stringify({
          email: "managed@example.test",
          name: "Managed User",
          roleIds: [],
          justification: "Conta aprovada",
        }),
      }),
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      code: "USER_EMAIL_CONFLICT",
      message: "Request conflicts with current state",
    });
  });
});
