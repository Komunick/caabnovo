// @vitest-environment happy-dom
import { act, type ComponentProps, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportCatalog } from "@caab/contracts";
import { WorkspaceDrafts } from "@/components/workspace-drafts";
import { ExportScreen } from "./export-screen";

const route = vi.hoisted(() => ({ kind: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/scheduling/exportar",
  useSearchParams: () => new URLSearchParams({ kind: route.kind }),
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
  route.kind = "";
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
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
  it("applies a delayed seed to an untouched draft and restores it after remount", async () => {
    const props = { initialFilters: { from: "2026-10-05" } };
    await render(props);
    await render({ ...props, seedFilters: { q: "Valor transportado" } });
    expect(field<HTMLInputElement>("export-filter-q").value).toBe("Valor transportado");
    expect(field<HTMLInputElement>("export-filter-from").value).toBe("2026-10-05");

    await render();
    await render(props);
    expect(field<HTMLInputElement>("export-filter-q").value).toBe("Valor transportado");
  });

  it.each(["Edição antes do transporte", ""])(
    "keeps a user edit (%j) when the seed arrives later",
    async (value) => {
      await render({});
      await type("export-filter-q", "Edição iniciada");
      await type("export-filter-q", value);
      await render({ seedFilters: { q: "Valor transportado" } });
      expect(field<HTMLInputElement>("export-filter-q").value).toBe(value);

      await render();
      await render({ seedFilters: { q: "Novo transporte" } });
      expect(field<HTMLInputElement>("export-filter-q").value).toBe(value);
    },
  );

  it("tracks seed eligibility separately for each draft scope in the mounted screen", async () => {
    await render({});
    await type("export-filter-q", "Edição do contexto A");

    route.kind = "context-b";
    await render({ seedFilters: { q: "Transporte do contexto B" } });
    expect(field<HTMLInputElement>("export-filter-q").value).toBe("Transporte do contexto B");

    route.kind = "";
    await render({ seedFilters: { q: "Não substituir A" } });
    expect(field<HTMLInputElement>("export-filter-q").value).toBe("Edição do contexto A");
  });

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
