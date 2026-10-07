// @vitest-environment happy-dom
import { StrictMode, act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportCatalog } from "@caab/contracts";
import { WorkspaceDrafts, useDraftCache } from "@/components/workspace-drafts";
import { WorkspacePermissions } from "@/components/workspace-permissions";
import { AccountMenu } from "@/modules/auth/ui/account-menu";
import { stashReportExportNotes } from "./client";
import type { ExportInitial } from "@/modules/exports/ui/export-screen";
import { ClearReportExportNotes, ReportExportScreen } from "./report-export-screen";

const route = vi.hoisted(() => ({ path: "/reports", query: "dataset=executive" }));
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.path,
  useSearchParams: () => new URLSearchParams(route.query),
  useRouter: () => router,
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const catalog: ExportCatalog = {
  module: "reports",
  dataset: "executive",
  label: "Resultados e evolução",
  columns: [
    { key: "id", label: "Indicador", scalarType: "text", defaultSelected: true, sortable: true },
    { key: "value", label: "Valor", scalarType: "number", defaultSelected: true, sortable: true },
  ],
  filters: [
    { key: "from", label: "Data inicial", type: "date" },
    { key: "notes", label: "Análise da gestão", type: "text" },
  ],
  formats: ["xlsx", "csv", "pdf"],
  csrfToken: "synthetic-token",
  timezone: "America/Bahia",
};
const initial: ExportInitial = { filters: { from: "2026-09-01" }, sort: "", direction: "desc" };
const text = "漢".repeat(2000);
const permissions = ["reports:read", "exports:generate"];
let root: Root,
  container: HTMLDivElement,
  logoutOK: boolean,
  strict: boolean,
  authenticatedId: string;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  route.path = "/reports";
  route.query = "dataset=executive";
  logoutOK = true;
  strict = false;
  authenticatedId = "A";
  window.sessionStorage.clear();
  router.replace.mockReset();
  router.refresh.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) =>
      path === "/api/auth/sign-out"
        ? { ok: logoutOK }
        : path.startsWith("/api/v1/exports/operations/")
          ? {
              ok: true,
              json: async () => ({
                requestId: path.split("/").at(-1),
                phase: "completed",
                rowCount: 1,
                byteCount: 1,
                errorCode: null,
              }),
            }
          : { ok: true, json: async () => ({ id: authenticatedId, permissions }) },
    ),
  );
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
function Handoff({ comment }: { comment: string | undefined }) {
  const cache = useDraftCache();
  return (
    <button
      onClick={() => stashReportExportNotes(cache, comment, `/reports/exportar?${route.query}`)}
    >
      Transportar
    </button>
  );
}
type Screen = "origin" | "export" | "denied" | "away";
async function render(
  screen: Screen = "export",
  screenInitial = initial,
  account = "A",
  comment: string | undefined = text,
  screenCatalog = catalog,
) {
  authenticatedId = account;
  route.path =
    screen === "origin" ? "/reports" : screen === "away" ? "/users" : "/reports/exportar";
  const workspace = (
    <WorkspacePermissions initial={[...permissions]} initialIdentityId={account}>
      <WorkspaceDrafts key={account}>
        <AccountMenu name={account} email={`${account}@example.test`} role="Gestor" />
        {screen === "origin" && <Handoff comment={comment} />}
        {screen === "denied" && <ClearReportExportNotes />}
        {screen === "export" && (
          <ReportExportScreen
            catalog={screenCatalog}
            sourcePermission="reports:read"
            backHref="/reports"
            initial={screenInitial}
          />
        )}
      </WorkspaceDrafts>
    </WorkspacePermissions>
  );
  await act(() => root.render(strict ? <StrictMode>{workspace}</StrictMode> : workspace));
}
async function handoff(comment = text, screenInitial = initial, account = "A") {
  await render("origin", screenInitial, account, comment);
  await act(() =>
    [...container.querySelectorAll("button")]
      .find((button) => button.textContent === "Transportar")!
      .click(),
  );
}
const notes = () => container.querySelector<HTMLTextAreaElement>("#export-filter-notes")!;
const from = () => container.querySelector<HTMLInputElement>("#export-filter-from")!;
async function type(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  await act(() => {
    Object.getOwnPropertyDescriptor(
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      "value",
    )!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function submit(value: string) {
  const form = container.querySelector<HTMLFormElement>(".export-form")!;
  const button = form.querySelector<HTMLButtonElement>(`button[type="submit"][value="${value}"]`)!;
  await act(() =>
    form.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true, submitter: button }),
    ),
  );
  return JSON.parse(form.querySelector<HTMLInputElement>('input[name="config"]')!.value);
}
async function logout() {
  await act(() =>
    container.querySelector<HTMLButtonElement>('[aria-label="Menu da conta de A"]')!.click(),
  );
  await act(() => container.querySelector<HTMLButtonElement>(".account-menu-logout")!.click());
}
describe("report export authenticated comment", () => {
  it("consumes the comment once under Strict Mode and restores edits after a real remount", async () => {
    strict = true;
    await handoff(text);
    await render();
    expect(notes().value).toBe(text);
    await type(notes(), "Editado no modo estrito");
    await render("away");
    await render();
    expect(notes().value).toBe("Editado no modo estrito");
  });
  it("preserves previous format, full multibyte comment and origin filters without storage", async () => {
    await handoff();
    await render("export", { ...initial, format: "csv" });
    expect(notes().value).toBe(text);
    expect(from().value).toBe("2026-09-01");
    const first = container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(first.value).toBe("csv");
    expect((await submit("csv")).filters).toEqual({ from: "2026-09-01", notes: text });
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });
  it("restores edited notes, filters, columns, ordering and format after navigating away and remounting", async () => {
    await handoff("Comentário trazido");
    await render();
    await type(notes(), "Comentário editado");
    await type(from(), "2026-08-01");
    await act(() => {
      container.querySelector<HTMLButtonElement>('[aria-label="Mover Valor para cima"]')!.click();
      const sort = container.querySelector<HTMLSelectElement>("#export-sort")!;
      sort.value = "value";
      sort.dispatchEvent(new Event("change", { bubbles: true }));
      const direction = container.querySelector<HTMLSelectElement>("#export-direction")!;
      direction.value = "asc";
      direction.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const config = await submit("pdf");
    expect(config.columns).toEqual(["value", "id"]);
    expect(config.sort).toEqual([{ field: "value", direction: "asc" }]);
    await render("away");
    await render("export", { ...initial });
    expect(notes().value).toBe("Comentário editado");
    expect(from().value).toBe("2026-08-01");
    // Submitting with no submitter uses the format retained in the draft.
    const form = container.querySelector<HTMLFormElement>(".export-form")!;
    await act(() => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(JSON.parse(form.querySelector<HTMLInputElement>('input[name="config"]')!.value)).toEqual(
      config,
    );
  });
  it("preserves an existing edited draft when an origin hands the comment over again", async () => {
    await handoff("Do relatório");
    await render();
    await type(notes(), "Editado na exportação");
    await handoff("Novo transporte");
    await render();
    expect(notes().value).toBe("Editado na exportação");
  });
  it("consumes the handoff only once", async () => {
    await handoff();
    await render();
    await render("away");
    await render("export", { ...initial, filters: { from: "2026-07-01" } });
    expect(notes().value).toBe("");
  });
  it("does not expose A's pending comment after real logout and authenticated workspace replacement by B", async () => {
    await handoff("Análise privada da conta A");
    await logout();
    expect(router.replace).toHaveBeenCalledWith("/login");
    await render("export", initial, "B");
    expect(notes().value).toBe("");
  });
  it.each(["focus", "poll"] as const)(
    "discards A's pending comment when %s detects B with identical permissions and a cached server layout",
    async (trigger) => {
      vi.useFakeTimers();
      const accountA = "11111111-1111-4111-8111-111111111111";
      const accountB = "22222222-2222-4222-8222-222222222222";
      let cookieAccount = accountA;
      const returnedAccounts: string[] = [];
      const readCurrentUser = vi.fn(async (path: string) => {
        if (path !== "/api/v1/me") throw new Error(`Unexpected request: ${path}`);
        returnedAccounts.push(cookieAccount);
        return Response.json({ id: cookieAccount, permissions: [...permissions] });
      });
      vi.stubGlobal("fetch", readCurrentUser);
      router.refresh.mockImplementation(() => {
        expect(container.querySelector('[aria-label^="Menu da conta"]')).toBeNull();
        expect(container.querySelector("#export-filter-notes")).toBeNull();
      });

      await handoff("Análise privada da conta A", initial, accountA);
      expect(returnedAccounts.at(-1)).toBe(accountA);
      cookieAccount = accountB; // Another tab replaces the shared session cookie.
      await act(async () => {
        if (trigger === "focus") window.dispatchEvent(new Event("focus"));
        else await vi.advanceTimersByTimeAsync(15000);
      });
      expect(returnedAccounts.at(-1)).toBe(accountB);
      expect(container.querySelector(".export-form")).toBeNull();
      expect(container.querySelector('[aria-label^="Menu da conta"]')).toBeNull();
      expect(container.querySelector('[role="status"]')?.textContent).toContain(
        "Atualizando sua sessão",
      );
      expect(router.refresh).toHaveBeenCalledTimes(1);

      // Next reuses layouts during navigation: the server's A key has not been refreshed.
      // Keep that key fixed instead of manually giving the draft provider a B key.
      await render("export", initial, accountA);
      expect(container.querySelector("#export-filter-notes")).toBeNull();
      expect(router.refresh).toHaveBeenCalledTimes(1);

      // Only the refreshed server layout belonging to B can reopen the workspace.
      await render("export", initial, accountB);
      expect(notes().value).toBe("");
      expect(window.sessionStorage.length).toBe(0);
      expect(window.localStorage.length).toBe(0);
    },
  );
  it("keeps edited drafts when focus and polling confirm the same account and permissions", async () => {
    vi.useFakeTimers();
    await handoff("Comentário da mesma conta");
    await render();
    await type(notes(), "Edição privada preservada");
    await type(from(), "2026-08-01");
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      await vi.advanceTimersByTimeAsync(15000);
    });
    await render("away");
    await render();
    expect(notes().value).toBe("Edição privada preservada");
    expect(from().value).toBe("2026-08-01");
    expect(router.refresh).not.toHaveBeenCalled();
  });
  it("unmounts A's already edited export before refresh and opens B with a fresh draft", async () => {
    let cookieAccount = "A";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ id: cookieAccount, permissions })),
    );
    await handoff("Análise inicial da conta A");
    await render();
    await type(notes(), "Análise privada editada da conta A");
    await type(from(), "2026-08-01");
    router.refresh.mockImplementation(() => {
      expect(container.querySelector(".export-form")).toBeNull();
      expect(container.textContent).not.toContain("Análise privada editada da conta A");
    });
    cookieAccount = "B";
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(container.querySelector("#export-filter-notes")).toBeNull();
    expect(router.refresh).toHaveBeenCalledTimes(1);
    await render("export", initial, "A");
    expect(container.querySelector("#export-filter-notes")).toBeNull();
    await render("export", initial, "B");
    expect(notes().value).toBe("");
    expect(from().value).toBe("2026-09-01");
  });
  it("updates changed permissions for the same identity without deleting its edited draft", async () => {
    let currentPermissions = [...permissions];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ id: "A", permissions: currentPermissions })),
    );
    await handoff("Comentário inicial");
    await render();
    await type(notes(), "Edição da mesma conta");
    currentPermissions = ["reports:read"];
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(container.querySelector(".export-form")).toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(router.refresh).toHaveBeenCalledTimes(1);
    currentPermissions = [...permissions];
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(notes().value).toBe("Edição da mesma conta");
    expect(router.refresh).toHaveBeenCalledTimes(2);
  });
  it("blocks an expired session before refreshing and does not reopen stale layouts or refresh repeatedly", async () => {
    vi.useFakeTimers();
    let sessionActive = true;
    let cookieAccount = "A";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sessionActive
          ? Response.json({ id: cookieAccount, permissions })
          : Response.json({ code: "AUTHENTICATION_REQUIRED" }, { status: 401 }),
      ),
    );
    await handoff("Comentário da sessão expirada");
    sessionActive = false;
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(container.querySelector('[aria-label^="Menu da conta"]')).toBeNull();
    expect(container.textContent).toContain("Atualizando sua sessão");
    expect(router.refresh).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(30000));
    await render("export", initial, "A");
    expect(container.querySelector("#export-filter-notes")).toBeNull();
    expect(router.refresh).toHaveBeenCalledTimes(1);

    sessionActive = true;
    cookieAccount = "B";
    await render("export", initial, "B");
    expect(notes().value).toBe("");
  });
  it("preserves the same account's edits across transient network and server failures", async () => {
    await handoff("Comentário inicial");
    await render();
    await type(notes(), "Edição preservada durante indisponibilidade");
    const fetchCurrentUser = vi.mocked(fetch);
    fetchCurrentUser.mockRejectedValueOnce(new Error("Synthetic network interruption"));
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(notes().value).toBe("Edição preservada durante indisponibilidade");
    fetchCurrentUser.mockResolvedValueOnce(Response.json({}, { status: 503 }));
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(notes().value).toBe("Edição preservada durante indisponibilidade");
    expect(router.refresh).not.toHaveBeenCalled();
  });
  it("ignores an old account response after its route generation was aborted", async () => {
    let cookieAccount = "A";
    let holdNext = false;
    let releaseOldResponse!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (holdNext) {
          holdNext = false;
          return new Promise<Response>((resolve) => {
            releaseOldResponse = resolve;
          });
        }
        return Response.json({ id: cookieAccount, permissions });
      }),
    );
    await handoff("Comentário privado antigo");
    holdNext = true;
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(releaseOldResponse).toBeDefined();
    cookieAccount = "B";
    await render("away", initial, "A");
    expect(container.textContent).toContain("Atualizando sua sessão");
    expect(router.refresh).toHaveBeenCalledTimes(1);

    await act(async () => releaseOldResponse(Response.json({ id: "A", permissions })));
    await render("export", initial, "A");
    expect(container.querySelector("#export-filter-notes")).toBeNull();
    expect(router.refresh).toHaveBeenCalledTimes(1);
    await render("export", initial, "B");
    expect(notes().value).toBe("");
  });
  it("clears pending comments on successful logout even before the workspace is replaced", async () => {
    await handoff("Análise privada da conta A");
    await logout();
    await render();
    expect(notes().value).toBe("");
  });
  it("keeps the pending comment when logout fails and the same session remains authenticated", async () => {
    await handoff("Privado");
    logoutOK = false;
    await logout();
    expect(router.replace).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Não foi possível sair");
    await render();
    expect(notes().value).toBe("Privado");
  });
  it("clears a pending comment when the destination is denied before rendering the form", async () => {
    await handoff("Privado");
    await render("denied");
    await render("away");
    await render();
    expect(notes().value).toBe("");
  });
  it("rejects the comment when navigating to another selection", async () => {
    await handoff("Da evolução");
    route.query = "dataset=summary";
    await render();
    expect(notes().value).toBe("");
    route.query = "dataset=executive";
    await render("away");
    await render();
    expect(notes().value).toBe("");
  });
  it("does not apply the previous seed when the selection changes without unmounting", async () => {
    await handoff("Da evolução");
    await render();
    expect(notes().value).toBe("Da evolução");
    route.query = "dataset=executive&from=2026-07-01";
    await render("export", { ...initial, filters: { from: "2026-07-01" } });
    expect(notes().value).toBe("");
  });
  it("accepts legacy URL notes while ignoring and deleting the previous global storage", async () => {
    window.sessionStorage.setItem(
      "caab:reports-export-notes",
      JSON.stringify({ text: "Análise privada da conta A", at: Date.now() }),
    );
    await render("export", {
      ...initial,
      filters: { ...initial.filters, notes: "Favorito antigo" },
    });
    expect(notes().value).toBe("Favorito antigo");
    expect(window.sessionStorage.length).toBe(0);
  });
  it("opens normally when browser storage is unavailable", async () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("denied");
    });
    await handoff();
    await render();
    expect(notes().value).toBe(text);
    expect(notes().disabled).toBe(false);
  });
  it("does not transport anything without the authenticated drafts provider", async () => {
    await act(() => root.render(<Handoff comment="Privado" />));
    await act(() => container.querySelector<HTMLButtonElement>("button")!.click());
    await render();
    expect(notes().value).toBe("");
  });
  it("discards the handoff for datasets without a comment field", async () => {
    await handoff();
    await render("export", initial, "A", text, { ...catalog, filters: [catalog.filters[0]!] });
    expect(container.querySelector("#export-filter-notes")).toBeNull();
    await render("away");
    await render();
    expect(notes().value).toBe("");
  });
});
