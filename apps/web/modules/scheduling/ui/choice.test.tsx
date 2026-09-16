// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Choice } from "./shared";
vi.mock("next/navigation", () => ({
  usePathname: () => "/scheduling/new",
  useSearchParams: () => new URLSearchParams(),
}));
let root: Root, container: HTMLDivElement;
const fetchMock = vi.fn();
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset().mockResolvedValue(
    Response.json({
      items: [
        { id: "a", name: "Unidade" },
        { id: "b", name: "Unidade" },
      ],
      page: 1,
      pageSize: 25,
      total: 2,
    }),
  );
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
function Form() {
  const [unit, setUnit] = useState("");
  return (
    <form>
      <Choice label="Unidade" resource="units" value={unit} onChange={setUnit} required />
      <output>{unit}</output>
    </form>
  );
}
async function render() {
  await act(() => root.render(<Form />));
  return container.querySelector("input")!;
}
async function tick() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}
async function type(input: HTMLInputElement, value: string) {
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function key(input: HTMLInputElement, name: string) {
  await act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true })));
}
it("uses one editable field and selects a homonymous option by its ID with the keyboard", async () => {
  const input = await render();
  await act(() => input.focus());
  await tick();
  expect(container.querySelectorAll("input")).toHaveLength(1);
  expect(container.querySelector("select")).toBeNull();
  await key(input, "ArrowDown");
  await key(input, "ArrowDown");
  await key(input, "Enter");
  expect(container.querySelector("output")!.textContent).toBe("b");
  expect(input.value).toBe("Unidade");
  expect(input.getAttribute("aria-expanded")).toBe("false");
  expect(input.validity.valid).toBe(true);
  await act(() => input.click());
  expect(input.getAttribute("aria-expanded")).toBe("true");
});
it("clears the selected ID when typing and blocks arbitrary labels from being submitted", async () => {
  const input = await render();
  await act(() => input.focus());
  await tick();
  await key(input, "ArrowDown");
  await key(input, "Enter");
  await type(input, "Outra unidade");
  expect(container.querySelector("output")!.textContent).toBe("");
  expect(input.validity.valid).toBe(false);
  await tick();
  expect(fetchMock.mock.calls.at(-1)![0]).toContain("q=Outra%20unidade");
});
it("aborts an obsolete search and hides its options while the new query is pending", async () => {
  const input = await render();
  await act(() => input.focus());
  await tick();
  const signal = fetchMock.mock.calls[0]![1].signal as AbortSignal;
  await type(input, "Inexistente");
  expect(signal.aborted).toBe(true);
  expect(container.querySelectorAll('[role="option"]')).toHaveLength(0);
  fetchMock.mockResolvedValue(Response.json({ items: [], page: 1, pageSize: 25, total: 0 }));
  await tick();
  expect(container.textContent).toContain("Nenhum registro encontrado");
  await key(input, "Escape");
  expect(input.getAttribute("aria-expanded")).toBe("false");
});
