import { syntheticUserContact } from "../helpers/user-contact";
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
            ...syntheticUserContact(),
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
        ...syntheticUserContact(),
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
          ...syntheticUserContact(),
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

describe("collaborator contact requirements", () => {
  const input = () => ({
    ...syntheticUserContact(),
    name: "Pessoa Sintética",
    email: "person@example.test",
    roleIds: [],
  });
  it.each(["name", "cpf", "email", "phone", "address"])(
    "requires %s even for direct HTTP creation",
    async (field) => {
      const create = vi.fn();
      const route = createUsersRoute({ resolveActor: async () => actor, list: vi.fn(), create });
      const body: Record<string, unknown> = input();
      delete body[field];
      const response = await route.POST(
        new Request("https://caab.example.test/api/v1/users", {
          method: "POST",
          headers: {
            origin: "https://caab.example.test",
            "x-csrf-token": crypto.randomUUID(),
            "idempotency-key": crypto.randomUUID(),
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
        }),
      );
      expect(response.status).toBe(422);
      expect(create).not.toHaveBeenCalled();
    },
  );
  it("normalizes masks and rejects invalid identities, phones and incomplete addresses", () => {
    const body = input();
    const formatted = body.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    expect(
      createUserRequestSchema.parse({
        ...body,
        cpf: formatted,
        phone: "(71) 99999-0000",
        address: { ...body.address, postalCode: "40000-000" },
      }),
    ).toMatchObject(body);
    for (const cpf of ["", "11111111111", "52998224724"])
      expect(createUserRequestSchema.safeParse({ ...body, cpf }).success).toBe(false);
    for (const phone of ["", "123", "(00) 99999-0000"])
      expect(createUserRequestSchema.safeParse({ ...body, phone }).success).toBe(false);
    for (const field of ["postalCode", "street", "number", "neighborhood", "city", "state"])
      expect(
        createUserRequestSchema.safeParse({ ...body, address: { ...body.address, [field]: "" } })
          .success,
      ).toBe(false);
    expect(updateUserRequestSchema.safeParse({ version: 1, name: "Legacy" }).success).toBe(true);
    expect(updateUserRequestSchema.safeParse({ version: 1, cpf: "" }).success).toBe(false);
  });
});
