// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DraftScope, WorkspaceDrafts } from "@/components/workspace-drafts";
import { RoleOptions, defaultRoleId } from "./role-options";

vi.mock("next/navigation", () => ({
  usePathname: () => "/users/new",
  useSearchParams: () => new URLSearchParams(),
}));

const roles = [
  { id: "role-admin", code: "administrator", name: "Administrador" },
  { id: "role-manager", code: "manager", name: "Gestor" },
  { id: "role-collaborator", code: "collaborator", name: "Colaborador" },
];
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
});
const checked = () =>
  [...container.querySelectorAll<HTMLInputElement>('input[name="roleIds"]:checked')].map(
    (input) => input.value,
  );

it("picks the base role only when it is offered", () => {
  expect(defaultRoleId(roles, "collaborator")).toBe("role-collaborator");
  expect(defaultRoleId(roles, undefined)).toBe("");
  expect(defaultRoleId(roles.slice(0, 2), "collaborator")).toBe("");
});

it("starts with the base role selected and offers no option without a role", async () => {
  await act(() =>
    root.render(
      <form>
        <RoleOptions roles={roles} name="roleIds" defaultCode="collaborator" />
      </form>,
    ),
  );
  expect(checked()).toEqual(["role-collaborator"]);
  expect(container.textContent).not.toContain("Sem cargo");
  const inputs = [...container.querySelectorAll<HTMLInputElement>('input[name="roleIds"]')];
  expect(inputs).toHaveLength(3);
  expect(inputs.every((input) => input.required && input.value !== "")).toBe(true);
});

it("restores the base role when the form is reset after another choice", async () => {
  await act(() =>
    root.render(
      <form>
        <RoleOptions roles={roles} name="roleIds" defaultCode="collaborator" />
      </form>,
    ),
  );
  const manager = container.querySelector<HTMLInputElement>('input[value="role-manager"]')!;
  await act(() => manager.click());
  expect(checked()).toEqual(["role-manager"]);
  await act(() => container.querySelector("form")!.dispatchEvent(new Event("reset")));
  expect(checked()).toEqual(["role-collaborator"]);
});

it("falls back to the base role when a saved draft points to a role no longer offered", async () => {
  await act(() =>
    root.render(
      <WorkspaceDrafts>
        <DraftScope name="saved">
          <form>
            <RoleOptions roles={roles} name="roleIds" defaultCode="collaborator" />
          </form>
        </DraftScope>
      </WorkspaceDrafts>,
    ),
  );
  const admin = container.querySelector<HTMLInputElement>('input[value="role-admin"]')!;
  await act(() => admin.click());
  expect(checked()).toEqual(["role-admin"]);
  // The same draft, now with the administrator role removed from the offered list.
  await act(() =>
    root.render(
      <WorkspaceDrafts>
        <DraftScope name="saved">
          <form>
            <RoleOptions roles={roles.slice(1)} name="roleIds" defaultCode="collaborator" />
          </form>
        </DraftScope>
      </WorkspaceDrafts>,
    ),
  );
  expect(checked()).toEqual(["role-collaborator"]);
});

it("keeps the previous behaviour without a default: nothing is selected until the user chooses", async () => {
  await act(() =>
    root.render(
      <form>
        <RoleOptions roles={roles} name="roleIds" />
      </form>,
    ),
  );
  expect(checked()).toEqual([]);
});
