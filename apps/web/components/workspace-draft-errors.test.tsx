// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WorkspaceDrafts } from "./workspace-drafts";
import { UserAccessForm } from "@/modules/users/ui/user-access-form";
import { DraftForm, DraftInput } from "./ui/draft-controls";
import { FormField } from "./ui/form-field";

let pathname = "/users/first";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ refresh: vi.fn() }),
}));
let root: Root, container: HTMLDivElement;
const fetchMock = vi.fn();
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  pathname = "/users/first";
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  fetchMock
    .mockReset()
    .mockImplementation(async () =>
      Response.json({ code: "ACCESS_VERSION_CONFLICT" }, { status: 409 }),
    );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
async function access(user = "first", version = 2) {
  pathname = `/users/${user}`;
  await act(() =>
    root.render(
      <WorkspaceDrafts>
        <UserAccessForm
          key={user}
          userId={user}
          initial={{ version, permissions: [] }}
          authority={["roles:grant", "roles:revoke", "members:read"]}
          self={false}
          active
        />
      </WorkspaceDrafts>,
    ),
  );
}
async function submit() {
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}
it("restores a failed access edit with its original version and isolates another record", async () => {
  await access();
  const option = [...container.querySelectorAll("label")]
    .find((label) => label.textContent?.includes("Consultar associados"))!
    .querySelector("input")!;
  await act(() => option.click());
  await submit();
  expect(container.querySelector('[role="alert"]')?.textContent).toContain("Os acessos mudaram");
  await access("second", 6);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.querySelector("input:checked")).toBeNull();
  await access("first", 7);
  expect(container.querySelector('[role="alert"]')?.textContent).toContain("Os acessos mudaram");
  expect(container.querySelector("input:checked")).not.toBeNull();
  await submit();
  expect(JSON.parse(fetchMock.mock.calls[1]![1].body)).toEqual({
    permissions: ["members:read"],
    expectedPermissions: [],
    version: 2,
  });
  fetchMock.mockResolvedValue(Response.json({ permissions: ["members:read"], version: 8 }));
  await submit();
  await access("second");
  await access("first", 8);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  await act(() => root.render(null));
  await access("first", 8);
  expect(container.querySelector("input:checked")).toBeNull();
});

it("keeps field validation across navigation and clears it on native reset", async () => {
  async function render(path: string) {
    pathname = path;
    await act(() =>
      root.render(
        <WorkspaceDrafts>
          {path === "/form" ? (
            <DraftForm draftKey="profile">
              <FormField id="name" label="Nome">
                <DraftInput required name="name" />
              </FormField>
            </DraftForm>
          ) : (
            <p>Outra área</p>
          )}
        </WorkspaceDrafts>,
      ),
    );
  }
  await render("/form");
  await act(() => {
    container.querySelector("input")!.checkValidity();
  });
  expect(container.querySelector('[role="alert"]')?.textContent).toBe("Preencha este campo.");
  await render("/other");
  await render("/form");
  expect(container.querySelector('[role="alert"]')?.textContent).toBe("Preencha este campo.");
  await act(() => container.querySelector("form")!.reset());
  expect(container.querySelector('[role="alert"]')).toBeNull();
  await render("/other");
  await render("/form");
  expect(container.querySelector('[role="alert"]')).toBeNull();
});
