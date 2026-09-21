// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ReportsPage } from "./reports-page";
import { reportRequest } from "./client";
import { reportQuerySchema } from "@caab/contracts";

vi.mock("./client", () => ({ reportRequest: vi.fn() }));
const request = vi.mocked(reportRequest);
let root: Root, container: HTMLDivElement, value: number, exportStatus: string;
const query = reportQuerySchema.parse({ from: "2026-09-01", to: "2026-09-18" });
function result() {
  return {
    canExport: true,
    catalog: [{ key: "members", label: "Associados" }],
    table: null,
    summary: {
      metrics: [
        {
          id: "members",
          label: "Novos associados",
          value,
          previous: 0,
          change: null,
          definition: "Cadastros no período",
        },
      ],
      inventory: [],
      series: [],
      notices: [],
      updatedAt: "2026-09-18T12:00:00Z",
    },
    usage: { firstEvent: null, sources: [], funnel: [] },
  };
}
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  value = 17;
  exportStatus = "retrying";
  request.mockReset().mockImplementation(async (path) => {
    if (path === "/queries") return [];
    if (path.startsWith("/exports"))
      return [
        {
          id: "export-1",
          status: exportStatus,
          progress: 10,
          created_at: "2026-09-18T12:00:00Z",
          configuration: { query, format: "csv" },
          safe_error_code: "JOB_FAILED",
        },
      ];
    return result();
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});
async function render() {
  await act(() => root.render(<ReportsPage environment="test" datasets={["members"]} />));
}
it("refreshes the displayed result when Generate is clicked with identical filters", async () => {
  await render();
  expect(container.querySelector("article strong")?.textContent).toBe("17");
  const initial = request.mock.calls.filter(([path]) => path.startsWith("?q="));
  value = 29;
  const generate = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "Gerar relatório",
  )!;
  await act(() => generate.click());
  const refreshed = request.mock.calls.filter(([path]) => path.startsWith("?q="));
  expect(refreshed).toHaveLength(initial.length + 1);
  expect(refreshed.at(-1)![0]).toBe(initial.at(-1)![0]);
  expect(container.querySelector("article strong")?.textContent).toBe("29");
});
it("polls a retrying export until its download becomes available without user action", async () => {
  await render();
  expect(container.textContent).toContain("Aguardando nova tentativa automática");
  expect(container.textContent).not.toContain("Solicitar novamente");
  exportStatus = "succeeded";
  await act(() => vi.advanceTimersByTimeAsync(3000));
  expect(
    container.querySelector('a[href="/api/v1/reports/exports/export-1/download"]')?.textContent,
  ).toContain("Baixar CSV");
  const count = request.mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(6000));
  expect(request.mock.calls).toHaveLength(count);
});
it("stops polling and offers a new request after definitive failure", async () => {
  await render();
  exportStatus = "failed";
  await act(() => vi.advanceTimersByTimeAsync(3000));
  expect(container.textContent).toContain("Falha na geração");
  expect(container.textContent).toContain("Solicitar novamente");
  const count = request.mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(6000));
  expect(request.mock.calls).toHaveLength(count);
});
