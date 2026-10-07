// @vitest-environment happy-dom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import SchedulingCalendar from "./calendar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/scheduling",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/workspace-permissions", () => ({ useModulePermission: () => true }));
type Event = { id: string; title: string; url: string; extendedProps: { label: string } };
vi.mock("@fullcalendar/react", () => ({
  default: ({
    events,
    eventDidMount,
  }: {
    events: Event[];
    eventDidMount(info: { el: HTMLElement; event: Event }): void;
  }) => (
    <div>
      {events.map((event) => (
        <a
          key={event.id}
          href={event.url}
          ref={(el) => {
            if (el) eventDidMount({ el, event });
          }}
        >
          {event.title}
        </a>
      ))}
    </div>
  ),
}));
let container: HTMLDivElement;
let root: Root;
const cases = (["day", "week", "month"] as const).flatMap((view) =>
  [null, "Profissional sintético"].map((professionalName) => ({ view, professionalName })),
);
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
it.each(cases)(
  "labels $view events with professional=$professionalName without exposing null",
  async ({ view, professionalName }) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          items: [
            {
              id: "synthetic-booking",
              startsAt: "2026-10-11T11:00:00.000Z",
              endsAt: "2026-10-11T11:30:00.000Z",
              status: "scheduled",
              memberName: "Pessoa sintética",
              unitName: "Unidade sintética",
              procedureName: "Atendimento sintético",
              professionalName,
            },
          ],
        }),
      ),
    );
    await act(async () =>
      root.render(<SchedulingCalendar date="2026-10-11" view={view} filters="" />),
    );
    const event = container.querySelector("a")!;
    const label = professionalName ?? "Atendimento por capacidade do serviço";
    for (const text of [event.textContent, event.title, event.getAttribute("aria-label")]) {
      expect(text).toContain(label);
      expect(text).not.toMatch(/null|undefined/);
    }
    expect(event.getAttribute("aria-label")).toContain("08:00 às 08:30");
  },
);
