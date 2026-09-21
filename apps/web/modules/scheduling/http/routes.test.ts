import type { Pool } from "pg";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { collectReportEvent } from "@caab/db/repositories/report-analytics";
import { createSchedulingBooking } from "../booking-service";
import { createSchedulingRoute } from "./routes";
import { logger } from "../../shared/logger";

vi.mock("@caab/db/repositories/report-analytics", () => ({ collectReportEvent: vi.fn() }));
vi.mock("../booking-service", () => ({
  createSchedulingBooking: vi.fn(),
  listSchedulingBookings: vi.fn(),
  getSchedulingBooking: vi.fn(),
  rescheduleSchedulingBooking: vi.fn(),
  cancelSchedulingBooking: vi.fn(),
}));
vi.mock("../../shared/logger", () => ({ logger: { warn: vi.fn() } }));
const bookingId = crypto.randomUUID();
const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set<string>(),
};
const pool = {} as Pool;
function request() {
  return new Request("https://caab.test/api/v1/scheduling/bookings", {
    method: "POST",
    headers: {
      origin: "https://caab.test",
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
      "content-type": "application/json",
      "x-analytics-visitor": crypto.randomUUID(),
      "x-analytics-session": crypto.randomUUID(),
    },
    body: "{}",
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
  vi.mocked(createSchedulingBooking).mockResolvedValue({
    value: { id: bookingId },
    replayed: false,
  } as never);
});
afterEach(() => vi.unstubAllEnvs());
it("returns a persisted booking before analytics starts and tolerates a blocked/rejected collection", async () => {
  let rejectCollection!: (error: Error) => void;
  vi.mocked(collectReportEvent).mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectCollection = reject;
      }),
  );
  const tasks: (() => Promise<void>)[] = [];
  const route = createSchedulingRoute({
    pool,
    resolveActor: async () => actor,
    afterResponse: (task) => {
      tasks.push(task);
    },
  });
  const response = await Promise.race([
    route(request(), ["bookings"]),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 100)),
  ]);
  expect(response?.status).toBe(201);
  expect(await response!.json()).toEqual({ id: bookingId });
  expect(collectReportEvent).not.toHaveBeenCalled();
  expect(tasks).toHaveLength(1);
  const collection = tasks[0]!();
  expect(collectReportEvent).toHaveBeenCalledOnce();
  rejectCollection(new Error("Synthetic database lock failure"));
  await expect(collection).resolves.toBeUndefined();
  expect(logger.warn).toHaveBeenCalled();
});
it("preserves the successful response even if after-response scheduling is unavailable", async () => {
  const route = createSchedulingRoute({
    pool,
    resolveActor: async () => actor,
    afterResponse: () => {
      throw new Error("No after context");
    },
  });
  const response = await route(request(), ["bookings"]);
  expect(response.status).toBe(201);
  expect(collectReportEvent).not.toHaveBeenCalled();
  expect(logger.warn).toHaveBeenCalled();
});
it("does not schedule analytics for a rejected booking", async () => {
  vi.mocked(createSchedulingBooking).mockRejectedValue({
    code: "SCHEDULING_CONFLICT",
    status: 409,
  });
  const afterResponse = vi.fn();
  const route = createSchedulingRoute({ pool, resolveActor: async () => actor, afterResponse });
  expect((await route(request(), ["bookings"])).status).toBe(409);
  expect(afterResponse).not.toHaveBeenCalled();
});
