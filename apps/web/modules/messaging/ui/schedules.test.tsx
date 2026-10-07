// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WorkspacePermissions } from "@/components/workspace-permissions";
import { MessageSchedulesPage } from "./schedules";

const navigation = vi.hoisted(() => ({
  pathname: "/messages/schedules",
  router: { refresh: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => navigation.router,
  useSearchParams: () => new URLSearchParams(),
}));

let root: Root, container: HTMLDivElement;
let permissions: string[];
const fetchMock = vi.fn();
const testIdentity = { initialIdentityId: "00000000-0000-4000-8000-000000000001" };
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  navigation.pathname = "/messages/schedules";
  navigation.router.refresh.mockClear();
  permissions = ["messages:access"];
  fetchMock.mockReset().mockImplementation(async (url: string) => {
    if (url === "/api/v1/me")
      return Response.json({ id: testIdentity.initialIdentityId, permissions });
    if (url.startsWith("/api/v1/messages/schedules?"))
      return Response.json({ items: [], page: 1, pageSize: 20, total: 0 });
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function render(initial: string[]) {
  await act(() =>
    root.render(
      <WorkspacePermissions {...testIdentity} initial={initial}>
        <MessageSchedulesPage />
      </WorkspacePermissions>,
    ),
  );
}
const creation = () => container.querySelector('a[href="/messages/campaigns/new"]');
function expectConsultation() {
  expect(container.querySelector("h1")?.textContent).toBe("Agendamentos");
  expect(container.querySelector('a[href="/messages"]')?.textContent).toContain("Campanhas");
  expect(container.textContent).toContain("Escolher campanha existente");
  expect(container.querySelector("#schedule-search")).not.toBeNull();
}

it("keeps consultation and omits creation without write permission", async () => {
  await render(permissions);
  expectConsultation();
  expect(creation()).toBeNull();
});

it("offers the existing creation link when write is authorized", async () => {
  permissions = ["messages:access", "messages:write"];
  await render(permissions);
  expectConsultation();
  expect(creation()?.textContent).toContain("Novo agendamento");
});

it.each(["focus", "poll", "navigation"])(
  "removes creation after revocation via %s while keeping consultation",
  async (trigger) => {
    permissions = ["messages:access", "messages:write"];
    const initial = permissions;
    await render(initial);
    expect(creation()).not.toBeNull();
    permissions = ["messages:access"];
    if (trigger === "focus") {
      await act(() => window.dispatchEvent(new Event("focus")));
    } else if (trigger === "poll") {
      await act(() => vi.advanceTimersByTimeAsync(15_000));
    } else {
      navigation.pathname = "/messages";
      await render(initial);
    }
    expect(creation()).toBeNull();
    expectConsultation();
    expect(navigation.router.refresh).toHaveBeenCalledOnce();
  },
);
