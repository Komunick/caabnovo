import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import type { Role } from "@caab/contracts";
import type { RoleRecord } from "@caab/db/repositories/roles";
import { listActiveRoles } from "@caab/db/repositories/roles";
import { resolveRequestActor } from "@/modules/auth/request-actor";
import { UserForm } from "@/modules/users/ui/user-form";
import NewUserPage from "./page";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/modules/auth/request-actor", () => ({ resolveRequestActor: vi.fn() }));
vi.mock("@/modules/shared/database", () => ({ getDatabase: () => ({ pool: {} }) }));
vi.mock("@caab/db/repositories/roles", () => ({ listActiveRoles: vi.fn() }));
vi.mock("@/modules/users/ui/user-form", () => ({ UserForm: vi.fn(() => null) }));

const baseRole: RoleRecord = {
  id: "00000000-0000-4000-8000-000000000035",
  code: "collaborator",
  name: "Colaborador",
  description: "Cargo base",
  administrative: false,
  status: "active",
  permissions: [],
};

function authenticate(permissions: string[]) {
  vi.mocked(resolveRequestActor).mockResolvedValue({
    userId: "00000000-0000-4000-8000-000000000001",
    sessionId: "synthetic-session",
    permissions: new Set(permissions),
  });
}

function findForm(node: ReactNode): ReactElement<{ mode: "create"; roles: Role[] }> | undefined {
  if (!isValidElement<{ children?: ReactNode }>(node)) return undefined;
  if (node.type === UserForm) return node as ReactElement<{ mode: "create"; roles: Role[] }>;
  return Children.toArray(node.props.children).map(findForm).find(Boolean);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listActiveRoles).mockResolvedValue([baseRole]);
});

it("does not offer role assignment to a delegated creator with roles:read but no roles:grant", async () => {
  authenticate(["users:read", "users:create", "roles:read"]);
  const form = findForm(await NewUserPage());
  expect(form?.props.mode).toBe("create");
  expect(form?.props.roles).toEqual([]);
  expect(listActiveRoles).not.toHaveBeenCalled();
});

it("offers active roles to an authorized role grantor", async () => {
  authenticate(["users:read", "users:create", "roles:read", "roles:grant"]);
  const form = findForm(await NewUserPage());
  expect(form?.props.roles).toEqual([
    {
      id: baseRole.id,
      code: baseRole.code,
      name: baseRole.name,
      description: baseRole.description,
      administrative: false,
      permissions: [],
    },
  ]);
  expect(listActiveRoles).toHaveBeenCalledOnce();
});

it("allows a creator without role permissions to use the server default", async () => {
  authenticate(["users:read", "users:create"]);
  expect(findForm(await NewUserPage())?.props.roles).toEqual([]);
  expect(listActiveRoles).not.toHaveBeenCalled();
});

it.each([
  { permissions: ["users:read", "roles:grant"] },
  { permissions: ["users:create", "roles:grant"] },
])("preserves the page access guard for %j", async ({ permissions }) => {
  authenticate(permissions);
  const page = await NewUserPage();
  expect(findForm(page)).toBeUndefined();
  expect(renderToStaticMarkup(page)).toContain(
    "Você não tem permissão para cadastrar colaboradores.",
  );
  expect(listActiveRoles).not.toHaveBeenCalled();
});

it("redirects an unauthenticated request to login", async () => {
  vi.mocked(resolveRequestActor).mockResolvedValue(null);
  await expect(NewUserPage()).rejects.toThrow("redirect:/login");
});
