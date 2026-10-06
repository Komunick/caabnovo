// @vitest-environment happy-dom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportCatalog } from "@caab/contracts";
import { WorkspaceDrafts } from "@/components/workspace-drafts";
import { REPORT_EXPORT_NOTES_KEY, stashReportExportNotes } from "./client";
import type { ExportInitial } from "@/modules/exports/ui/export-screen";
import { ReportExportScreen } from "./report-export-screen";

vi.mock("next/navigation", () => ({
  usePathname: () => "/reports/exportar",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/components/workspace-permissions", () => ({
  PermissionGate: ({ children }: { children: ReactNode }) => children,
}));

const catalog: ExportCatalog = {
  module: "reports",
  dataset: "executive",
  label: "Resultados e evolução",
  columns: [
    { key: "id", label: "Indicador", scalarType: "text", defaultSelected: true, sortable: true },
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
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.sessionStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});
async function render(screenInitial = initial, screenCatalog = catalog) {
  await act(() =>
    root.render(
      <WorkspaceDrafts>
        <ReportExportScreen
          catalog={screenCatalog}
          sourcePermission="reports:read"
          backHref="/reports"
          initial={screenInitial}
        />
      </WorkspaceDrafts>,
    ),
  );
}
const notes = () => container.querySelector<HTMLTextAreaElement>("#export-filter-notes")!;
const from = () => container.querySelector<HTMLInputElement>("#export-filter-from")!;

describe("report export screen comment", () => {
  it("fills the comment with the full text handed over by the link and removes the key", async () => {
    stashReportExportNotes(text);
    await render();
    expect(notes().value).toHaveLength(2000);
    expect(notes().value).toBe(text);
    expect(window.sessionStorage.getItem(REPORT_EXPORT_NOTES_KEY)).toBeNull();
    // Other filters from the URL are kept.
    expect(from().value).toBe("2026-09-01");
  });
  it("does not overwrite what the user types afterwards", async () => {
    stashReportExportNotes("Comentário trazido");
    await render();
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
        notes(),
        "Editado na tela",
      );
      notes().dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(notes().value).toBe("Editado na tela");
    await render({ ...initial });
    expect(notes().value).toBe("Editado na tela");
  });
  it("renders without a comment when nothing was handed over", async () => {
    await render();
    expect(notes().value).toBe("");
    expect(from().value).toBe("2026-09-01");
  });
  it("still accepts the legacy ?notes= selection", async () => {
    await render({ ...initial, filters: { ...initial.filters, notes: "Favorito antigo" } });
    expect(notes().value).toBe("Favorito antigo");
  });
  it("lets the handed-over comment win over a legacy one", async () => {
    stashReportExportNotes("Do link");
    await render({ ...initial, filters: { ...initial.filters, notes: "Favorito antigo" } });
    expect(notes().value).toBe("Do link");
  });
  it("opens normally and keeps the field editable when sessionStorage throws", async () => {
    const fail = () => {
      throw new Error("denied");
    };
    vi.spyOn(window, "sessionStorage", "get").mockReturnValue({
      getItem: fail,
      setItem: fail,
      removeItem: fail,
    } as unknown as Storage);
    await render();
    expect(container.querySelector("h1")?.textContent).toContain("Exportar");
    expect(notes().value).toBe("");
    expect(notes().disabled).toBe(false);
    expect(from().value).toBe("2026-09-01");
  });
  it("ignores the hand-over for datasets without a comment field", async () => {
    stashReportExportNotes("Não se aplica");
    await render(initial, { ...catalog, dataset: "members", filters: [catalog.filters[0]!] });
    expect(container.querySelector("#export-filter-notes")).toBeNull();
    expect(window.sessionStorage.getItem(REPORT_EXPORT_NOTES_KEY)).toBeNull();
  });
});
