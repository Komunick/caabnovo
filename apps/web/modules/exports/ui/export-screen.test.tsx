// @vitest-environment happy-dom
import { act, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportCatalog } from "@caab/contracts";
import { WorkspaceDrafts } from "@/components/workspace-drafts";
import { ExportScreen } from "./export-screen";

vi.mock("next/navigation", () => ({
  usePathname: () => "/scheduling/exportar",
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
  module: "scheduling",
  dataset: "bookings",
  label: "Agendamentos",
  columns: [
    {
      key: "id",
      label: "Identificador",
      scalarType: "text",
      defaultSelected: true,
      sortable: true,
    },
    {
      key: "member",
      label: "Beneficiário",
      scalarType: "text",
      defaultSelected: true,
      sortable: true,
    },
  ],
  filters: [
    { key: "q", label: "Beneficiário", type: "text" },
    { key: "from", label: "A partir de", type: "date" },
  ],
  formats: ["xlsx", "csv", "pdf"],
  csrfToken: "synthetic-token",
  timezone: "America/Bahia",
};
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function render(props?: Partial<ComponentProps<typeof ExportScreen>>) {
  await act(() =>
    root.render(
      <WorkspaceDrafts>
        {props && (
          <ExportScreen
            catalog={catalog}
            sourcePermission="scheduling:read"
            backHref="/scheduling"
            {...props}
          />
        )}
      </WorkspaceDrafts>,
    ),
  );
}
function field<T extends HTMLInputElement | HTMLSelectElement>(id: string) {
  return container.querySelector<T>(`#${id}`)!;
}
async function type(id: string, value: string) {
  await act(() => {
    const input = field<HTMLInputElement>(id);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function select(id: string, value: string) {
  await act(() => {
    const input = field<HTMLSelectElement>(id);
    input.value = value;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
function column(label: string) {
  const row = [...container.querySelectorAll(".export-column-order li")].find(
    (item) => item.querySelector("label")?.textContent === label,
  )!;
  return row.querySelector<HTMLInputElement>("input")!;
}
function columnOrder() {
  return [...container.querySelectorAll(".export-column-order label")].map(
    (item) => item.textContent,
  );
}

describe("export drafts from different list filters", () => {
  it.each([false, true])(
    "keeps A and B edits separate when the screen remounts=%s",
    async (remount) => {
      const a = { q: "Pessoa A", from: "2026-10-05" };
      const b = { q: "Pessoa B", from: "2026-10-06" };
      await render({ initialFilters: a });
      expect(field<HTMLInputElement>("export-filter-q").value).toBe("Pessoa A");
      await type("export-filter-q", "Pessoa A em edição");
      await act(() => column("Identificador").click());
      await select("export-sort", "member");
      await select("export-direction", "desc");

      if (remount) await render();
      await render({ initialFilters: b });
      expect(field<HTMLInputElement>("export-filter-q").value).toBe("Pessoa B");
      expect(field<HTMLInputElement>("export-filter-from").value).toBe(b.from);
      expect(column("Identificador").checked).toBe(true);
      expect(field<HTMLSelectElement>("export-sort").value).toBe("");
      expect(field<HTMLSelectElement>("export-direction").value).toBe("asc");
      await type("export-filter-q", "Pessoa B em edição");
      await act(() =>
        container
          .querySelector<HTMLButtonElement>('[aria-label="Mover Beneficiário para cima"]')!
          .click(),
      );

      if (remount) await render();
      // Equivalent filters in another property order still restore A's draft.
      await render({ initialFilters: { from: a.from, q: a.q } });
      expect(field<HTMLInputElement>("export-filter-q").value).toBe("Pessoa A em edição");
      expect(field<HTMLInputElement>("export-filter-from").value).toBe(a.from);
      expect(column("Identificador").checked).toBe(false);
      expect(field<HTMLSelectElement>("export-sort").value).toBe("member");
      expect(field<HTMLSelectElement>("export-direction").value).toBe("desc");

      if (remount) await render();
      await render({ initialFilters: b });
      expect(field<HTMLInputElement>("export-filter-q").value).toBe("Pessoa B em edição");
      expect(column("Identificador").checked).toBe(true);
      expect(columnOrder()).toEqual(["Beneficiário", "Identificador"]);
      expect(field<HTMLSelectElement>("export-sort").value).toBe("");
    },
  );

  it("uses the explicit selection's filters and preserves it when fallback filters change", async () => {
    const initial = {
      filters: { q: "Seleção explícita" },
      columns: ["member"],
      sort: "member",
      direction: "desc" as const,
    };
    await render({ initial, initialFilters: { q: "Filtro da lista A" } });
    expect(field<HTMLInputElement>("export-filter-q").value).toBe("Seleção explícita");
    expect(column("Identificador").checked).toBe(false);
    expect(field<HTMLSelectElement>("export-sort").value).toBe("member");
    expect(field<HTMLSelectElement>("export-direction").value).toBe("desc");
    await type("export-filter-q", "Seleção em edição");
    await render();
    await render({ initial, initialFilters: { q: "Filtro da lista B" } });
    expect(field<HTMLInputElement>("export-filter-q").value).toBe("Seleção em edição");
  });
});

it.each([0, 1, 2])(
  "announces a completed export with the correct record count %s",
  async (rowCount) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        Response.json({
          requestId: url.split("/").at(-1),
          phase: "completed",
          rowCount,
          byteCount: 100,
          errorCode: null,
        }),
      ),
    );
    await render({ initialFilters: {} });
    const submitter = container.querySelector<HTMLButtonElement>('button[value="csv"]')!;
    await act(async () => {
      submitter
        .closest("form")!
        .dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true, submitter }));
    });
    expect(container.querySelector('[role="status"]')!.textContent).toContain(
      `${rowCount} ${rowCount === 1 ? "registro" : "registros"}.`,
    );
  },
);

it("announces one selected column in the singular", async () => {
  await render({ initial: { columns: ["id"] } });
  expect(container.querySelector("fieldset:last-of-type")!.textContent).toContain("1 selecionada.");
});
