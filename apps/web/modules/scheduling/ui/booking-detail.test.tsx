// @vitest-environment happy-dom
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { SchedulingBooking } from "@caab/contracts";
import { WorkspaceDrafts } from "@/components/workspace-drafts";
import { SchedulingBookingDetail } from "./booking-detail";

vi.mock("next/navigation", () => ({
  usePathname: () => "/scheduling/test-booking",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  useLinkStatus: () => ({ pending: false }),
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/workspace-permissions", () => ({ useModulePermission: () => true }));
vi.mock("./booking-form", () => ({ BookingForm: () => null }));
vi.mock("./booking-absence", () => ({ BookingAbsence: () => null }));

let container: HTMLDivElement;
let root: Root;
let booking: SchedulingBooking;
const fetchMock = vi.fn();
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  booking = {
    id: crypto.randomUUID(),
    memberId: crypto.randomUUID(),
    memberName: "Pessoa sintética",
    assignmentId: null,
    unitId: crypto.randomUUID(),
    unitName: "Unidade sintética",
    serviceId: crypto.randomUUID(),
    serviceName: "Serviço sintético",
    procedureId: crypto.randomUUID(),
    procedureName: "Atendimento sintético",
    professionalId: null,
    professionalName: null,
    eligibilityWarning: null,
    durationMinutes: 30,
    startsAt: "2099-10-11T11:00:00.000Z",
    endsAt: "2099-10-11T11:30:00.000Z",
    status: "scheduled",
    mode: "capacity",
    confirmedReschedules: 1,
    version: 1,
  };
  fetchMock.mockReset().mockImplementation(async () =>
    Response.json({
      booking,
      history: {
        page: 1,
        pageSize: 25,
        total: 1,
        items: [
          {
            id: crypto.randomUUID(),
            action: "rescheduled",
            actorName: "Operador sintético",
            occurredAt: "2026-10-06T12:00:00.000Z",
            before: booking,
            after: booking,
          },
        ],
      },
    }),
  );
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
  await act(async () =>
    root.render(
      <WorkspaceDrafts>
        <SchedulingBookingDetail id={booking.id} />
      </WorkspaceDrafts>,
    ),
  );
}
function button(name: string, scope: ParentNode = document) {
  const target = [...scope.querySelectorAll<HTMLButtonElement>("button")].find(
    (e) => (e.getAttribute("aria-label") ?? e.textContent?.trim()) === name,
  );
  expect(target, `Botão ${name}`).toBeDefined();
  return target!;
}
const actions = [
  "Aprovar pedido",
  "Recusar pedido",
  "Retirar proposta",
  "Estabelecimento não poderá atender",
];
it.each(
  actions.flatMap((action) => ["Escape", "Fechar", "Voltar"].map((close) => ({ action, close }))),
)(
  "returns focus to $action when dismissed with $close without sending a decision",
  async ({ action, close }) => {
    if (action !== "Estabelecimento não poderá atender") {
      booking.status = "pending_approval";
      booking.processKind = "voluntary";
      booking.originalStart = booking.startsAt;
    }
    await render();
    const trigger = button(action);
    await act(() => {
      trigger.focus();
      trigger.click();
    });
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await act(async () => {
      if (close === "Escape")
        document.activeElement?.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      else button(close, document.querySelector('[role="dialog"]')!).click();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await vi.waitFor(() => expect(document.activeElement === trigger).toBe(true));
    expect(fetchMock.mock.calls.every(([, init]) => !init?.method)).toBe(true);
  },
);
it.each([0, 1, 2, null])(
  "presents the reschedule count %s and readable history without a professional",
  async (count) => {
    booking.confirmedReschedules = count;
    await render();
    expect(container.querySelector(".scheduling-history")!.textContent).not.toMatch(
      /·\s*·|null|undefined/,
    );
    expect(container.textContent).toContain(
      count === null
        ? "Contagem anterior desconhecida"
        : `${count} ${count === 1 ? "confirmada" : "confirmadas"}`,
    );
  },
);
it("retains the professional in historical snapshots", async () => {
  booking.professionalName = "Profissional sintético";
  await render();
  expect(container.querySelector(".scheduling-history")!.textContent).toContain(
    " · Profissional sintético · Atendimento sintético",
  );
});
