import { z } from "zod";
import { nonEmptyReasonSchema } from "./common";

export const accessPermissionSchema = z.enum([
  "reports:read",
  "exports:generate",
  "access:manage",
  "scheduling:read",
  "scheduling:write",
  "messages:write",
  "messages:access",
  "partners:read",
  "partners:write",
  "partners:publish",
  "news:read",
  "news:write",
  "news:publish",
  "members:read",
  "members:write",
  "members:review",
  "users:read",
  "users:create",
  "users:update",
  "users:disable",
  "users:delete",
  "users:reset-password",
  "roles:read",
  "roles:grant",
  "roles:revoke",
  "audit:read",
  "jobs:read",
  "jobs:redrive",
  "files:read",
  "files:create",
  "files:delete",
]);
export type AccessPermission = z.infer<typeof accessPermissionSchema>;
export const accessPrerequisites: Partial<Record<AccessPermission, AccessPermission[]>> = {
  "scheduling:write": ["scheduling:read"],
  "messages:write": ["messages:access"],
  "access:manage": ["users:read", "roles:read"],
  "partners:write": ["partners:read"],
  "partners:publish": ["partners:read"],
  "news:write": ["news:read"],
  "news:publish": ["news:read", "news:write"],
  "members:write": ["members:read"],
  "members:review": ["members:read"],
  "users:create": ["users:read"],
  "users:update": ["users:read"],
  "users:disable": ["users:read"],
  "users:delete": ["users:read"],
  "roles:read": ["users:read"],
  "roles:grant": ["users:read", "roles:read"],
  "roles:revoke": ["users:read", "roles:read"],
  "jobs:redrive": ["jobs:read"],
};
const permissions = z
  .array(accessPermissionSchema)
  .max(accessPermissionSchema.options.length)
  .refine((values) => new Set(values).size === values.length, "Permissões repetidas.");
export const userAccessChangeSchema = z
  .object({
    permissions,
    expectedPermissions: z.array(z.string().regex(/^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/)).max(100),
    version: z.number().int().min(0),
    justification: nonEmptyReasonSchema.max(1000).default(""),
  })
  .strict()
  .refine(
    (input) =>
      input.permissions.every((key) =>
        (accessPrerequisites[key] ?? []).every((required) => input.permissions.includes(required)),
      ),
    { path: ["permissions"], message: "Selecione também os acessos necessários para essa ação." },
  );
export type UserAccessChange = z.infer<typeof userAccessChangeSchema>;
