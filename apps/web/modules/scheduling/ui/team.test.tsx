// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WorkspaceDrafts } from "@/components/workspace-drafts";
import { SchedulingTeam } from "./team";

const access = vi.hoisted(() => ({ permissions: new Set<string>() }));
vi.mock("@/components/workspace-permissions", () => ({
  useModulePermission: (permission: string) => access.permissions.has(permission),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/scheduling/hours",
  useSearchParams: () => new URLSearchParams(),
}));
const unitId = crypto.randomUUID();
const team = { version: 1, items: [{ id: crypto.randomUUID(), name: "Colaborador privado" }] };
const fetchMock = vi.fn();
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  access.permissions = new Set(["scheduling:read"]);
  fetchMock.mockReset().mockImplementation(async () => Response.json(team));
  vi.stubGlobal("fetch", fetchMock);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
async function render() {
  await act(() =>
    root.render(
      <WorkspaceDrafts>
        <SchedulingTeam unitId={unitId} />
      </WorkspaceDrafts>,
    ),
  );
}

it("does not fetch or reveal the directory to a scheduling reader", async () => {
  await render();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(container.textContent).toBe("");
});

it.each(["scheduling:write", "users:read"])(
  "loads the directory with %s and hides it immediately on revocation",
  async (permission) => {
    access.permissions.add(permission);
    await render();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/scheduling/units/${unitId}/team`,
      expect.any(Object),
    );
    expect(container.textContent).toContain(team.items[0]!.name);
    const signal = fetchMock.mock.calls[0]![1].signal as AbortSignal;
    const calls = fetchMock.mock.calls.length;
    access.permissions.delete(permission);
    await render();
    expect(container.textContent).toBe("");
    expect(signal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(calls);
  },
);

it("does not reveal a late directory response after access is revoked", async () => {
  let resolve!: (response: Response) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise<Response>((done) => {
        resolve = done;
      }),
  );
  access.permissions.add("users:read");
  await render();
  access.permissions.delete("users:read");
  await render();
  await act(async () => {
    resolve(Response.json(team));
  });
  expect(container.textContent).toBe("");
  expect(fetchMock).toHaveBeenCalledOnce();
});
