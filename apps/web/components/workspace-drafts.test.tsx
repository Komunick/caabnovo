// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceDrafts, useDraftState } from "./workspace-drafts";
import { DraftForm, DraftInput, DraftSelect } from "./ui/draft-controls";
import { BrazilianAddressFields } from "./ui/brazilian-address-fields";
import { BirthDateField } from "@/modules/members/ui/birth-date-field";
const route = vi.hoisted(() => ({ path: "/members/a", kind: "" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.path,
  useSearchParams: () => new URLSearchParams({ kind: route.kind }),
}));
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  route.path = "/members/a";
  route.kind = "";
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});
function Editor({ record = "Original" }: { record?: string }) {
  const [body, setBody] = useDraftState("body", { text: record });
  const [selection, setSelection] = useDraftState("selection", new Set<string>());
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          setBody({ text: "Texto em edição" });
          setSelection(new Set(["members:write"]));
          setBusy(true);
        }}
      >
        Editar
      </button>
      <output>
        {body.text}|{[...selection].join()}|{String(busy)}
      </output>
      <DraftForm draftKey="profile">
        <DraftInput aria-label="Nome" name="name" defaultValue={record} />
        <DraftInput aria-label="Ativo" name="active" type="checkbox" defaultChecked />
        <DraftInput aria-label="Acesso A" name="roles" type="checkbox" value="a" />
        <DraftInput aria-label="Acesso B" name="roles" type="checkbox" value="b" />
        <DraftSelect aria-label="Tipo" name="type" defaultValue="a">
          <option value="a">A</option>
          <option value="b">B</option>
        </DraftSelect>
        <BirthDateField id="birth" defaultValue="" disabled={false} />
      </DraftForm>
      <DraftForm draftKey="unit">
        <DraftInput aria-label="Unidade" name="name" />
        <BrazilianAddressFields prefix="unit" />
      </DraftForm>
    </>
  );
}
async function render(visible = true, account = "account-a", record = "Original") {
  await act(() =>
    root.render(
      <WorkspaceDrafts key={account}>
        {visible && <Editor key={route.path + route.kind} record={record} />}
      </WorkspaceDrafts>,
    ),
  );
}
function input(label: string) {
  return container.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
}
async function type(element: HTMLInputElement, value: string) {
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
describe("workspace edits", () => {
  it("restores React values after unmount without restoring an in-flight action", async () => {
    await render();
    await act(() => container.querySelector("button")!.click());
    await render(false);
    await render();
    expect(container.querySelector("output")!.textContent).toBe(
      "Texto em edição|members:write|false",
    );
  });
  it("preserves native fields, checkbox groups and selections between modules", async () => {
    await render();
    await type(input("Nome"), "Pessoa incompleta");
    await act(() => {
      input("Ativo").click();
      input("Acesso B").click();
      const select = container.querySelector("select")!;
      select.value = "b";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    route.path = "/news/new";
    await render();
    expect(input("Nome").value).toBe("Original");
    route.path = "/members/a";
    await render();
    expect(input("Nome").value).toBe("Pessoa incompleta");
    expect(input("Ativo").checked).toBe(false);
    expect(input("Acesso A").checked).toBe(false);
    expect(input("Acesso B").checked).toBe(true);
    expect(container.querySelector("select")!.value).toBe("b");
  });
  it("isolates records and catalog tabs while keeping their individual edits", async () => {
    await render();
    await type(input("Nome"), "Registro A");
    route.path = "/members/b";
    await render();
    await type(input("Nome"), "Registro B");
    route.kind = "services";
    await render();
    expect(input("Nome").value).toBe("Original");
    route.kind = "";
    await render();
    expect(input("Nome").value).toBe("Registro B");
    route.path = "/members/a";
    await render();
    expect(input("Nome").value).toBe("Registro A");
  });
  it("a successful form reset clears only that form, including controlled address fields", async () => {
    await render();
    await type(input("Nome"), "Outro nome");
    await type(input("Unidade"), "Unidade em edição");
    await type(container.querySelector<HTMLInputElement>("#unit-city")!, "Salvador");
    await act(() => container.querySelector("form")!.reset());
    await render(false);
    await render(true, "account-a", "Salvo");
    expect(input("Nome").value).toBe("Salvo");
    expect(input("Unidade").value).toBe("Unidade em edição");
    expect(container.querySelector<HTMLInputElement>("#unit-city")!.value).toBe("Salvador");
    await act(() => container.querySelectorAll("form")[1]!.reset());
    await render(false);
    await render();
    expect(container.querySelector<HTMLInputElement>("#unit-city")!.value).toBe("");
  });
  it("retains the original snapshot when another server revision arrives", async () => {
    await render();
    await act(() => container.querySelector("button")!.click());
    await render(false);
    await render(true, "account-a", "Versão alterada por outra pessoa");
    expect(container.querySelector("output")!.textContent).toContain("Texto em edição");
  });
  it("clears private edits when the authenticated workspace is replaced", async () => {
    await render();
    await type(input("Nome"), "Não compartilhar");
    await render(true, "account-b");
    expect(input("Nome").value).toBe("Original");
    await render(true, "account-a");
    expect(input("Nome").value).toBe("Original");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

it("restores a select after its options arrive asynchronously", async () => {
  async function options(loaded: boolean, shown = true) {
    await act(() =>
      root.render(
        <WorkspaceDrafts>
          {shown && (
            <DraftForm draftKey="async">
              <DraftSelect name="fileId" defaultValue="">
                <option value="">Selecione</option>
                {loaded && <option value="document">Documento disponível</option>}
              </DraftSelect>
            </DraftForm>
          )}
        </WorkspaceDrafts>,
      ),
    );
  }
  await options(true);
  await act(() => {
    const select = container.querySelector("select")!;
    select.value = "document";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await options(false, false);
  await options(false);
  await options(true);
  expect(container.querySelector("select")!.value).toBe("document");
});
it("restores a pending file without repeating its upload handler", async () => {
  const changed = vi.fn();
  async function show(visible: boolean) {
    await act(() =>
      root.render(
        <WorkspaceDrafts>
          {visible && (
            <DraftForm draftKey="file">
              <DraftInput name="attachment" type="file" onChange={changed} />
            </DraftForm>
          )}
        </WorkspaceDrafts>,
      ),
    );
  }
  await show(true);
  await act(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["synthetic"], "document.txt", { type: "text/plain" }));
    const file = container.querySelector("input")!;
    file.files = transfer.files;
    file.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await show(false);
  await show(true);
  expect(container.querySelector("input")!.files![0]!.name).toBe("document.txt");
  expect(changed).toHaveBeenCalledTimes(1);
});
