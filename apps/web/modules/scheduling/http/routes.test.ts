import type { Pool } from "pg";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { collectReportEvent } from "@caab/db/repositories/report-analytics";
import { createSchedulingBooking, listSchedulingBookings } from "../booking-service";
import {
  schedulingAbsenceRecordSchema,
  schedulingAbsenceAppealSchema,
  schedulingAbsenceDecisionSchema,
  schedulingAbsenceQuerySchema,
} from "@caab/contracts";
import {
  recordSchedulingAbsence,
  getSchedulingAbsence,
  listSchedulingAbsences,
  submitSchedulingAbsenceAppeal,
  decideSchedulingAbsence,
} from "../absence-service";
import type { WebObjectStorage } from "../../files/object-storage";
import {
  getSchedulingAbsenceReview,
  getSchedulingAbsenceEvidenceDownload,
} from "../absence-evidence-service";
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
vi.mock("../absence-evidence-service", () => ({
  getSchedulingAbsenceReview: vi.fn(),
  getSchedulingAbsenceEvidenceDownload: vi.fn(),
}));
vi.mock("../absence-service", () => ({
  getSchedulingAbsence: vi.fn(),
  listSchedulingAbsences: vi.fn(),
  submitSchedulingAbsenceAppeal: vi.fn(),
  decideSchedulingAbsence: vi.fn(),
  recordSchedulingAbsence: vi.fn(),
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
    value: { id: bookingId, status: "scheduled" },
    replayed: false,
  } as never);
});
afterEach(() => vi.unstubAllEnvs());
it.each(["GET", "POST"])("preserves a permission denial from the domain for %s", async (method) => {
  const denial = Object.assign(new Error("PERMISSION_DENIED"), {
    code: "PERMISSION_DENIED",
    status: 403,
  });
  vi.mocked(listSchedulingBookings).mockRejectedValue(denial);
  vi.mocked(createSchedulingBooking).mockRejectedValue(denial);
  const afterResponse = vi.fn();
  const route = createSchedulingRoute({ pool, resolveActor: async () => actor, afterResponse });
  const response = await route(
    method === "POST"
      ? request()
      : new Request("https://caab.test/api/v1/scheduling/bookings?date=2026-09-28"),
    ["bookings"],
  );
  expect(response.status).toBe(403);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toMatchObject({ code: "PERMISSION_DENIED" });
  expect(afterResponse).not.toHaveBeenCalled();
});
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
  expect(await response!.json()).toEqual({ id: bookingId, status: "scheduled" });
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
it("does not report a pending request as a confirmed booking", async () => {
  vi.mocked(createSchedulingBooking).mockResolvedValue({
    value: { id: bookingId, status: "pending_approval" },
    replayed: false,
  } as never);
  const afterResponse = vi.fn();
  const route = createSchedulingRoute({ pool, resolveActor: async () => actor, afterResponse });
  expect((await route(request(), ["bookings"])).status).toBe(201);
  expect(afterResponse).not.toHaveBeenCalled();
});

const absenceId = crypto.randomUUID();
const absence = { id: absenceId, version: 2 };
const appealBody = {
  expectedVersion: 1,
  kind: "justification",
  explanation: "Atestado apresentado",
  evidenceFileIds: [crypto.randomUUID()],
};
const decisionBody = { expectedVersion: 2, outcome: "accepted" };
function absenceRequest(action: string, body: unknown, removeHeader?: string) {
  const headers = new Headers(request().headers);
  if (removeHeader) headers.delete(removeHeader);
  return new Request(`https://caab.test/api/v1/scheduling/absences/${absenceId}/${action}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}
function absenceRoute(authenticated = true) {
  return createSchedulingRoute({
    pool,
    resolveActor: async () => (authenticated ? actor : null),
    afterResponse: vi.fn(),
  });
}
it("reads an absence through the administrative domain with a private response", async () => {
  vi.mocked(getSchedulingAbsence).mockResolvedValue(absence as never);
  const response = await absenceRoute()(
    new Request(`https://caab.test/api/v1/scheduling/absences/${absenceId}`),
    ["absences", absenceId],
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(absence);
  expect(getSchedulingAbsence).toHaveBeenCalledWith(pool, actor, absenceId);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it.each([
  { action: "appeal", fn: submitSchedulingAbsenceAppeal, body: appealBody },
  { action: "decision", fn: decideSchedulingAbsence, body: decisionBody },
])(
  "delegates $action with the authenticated context and replays a successful result",
  async ({ action, fn, body }) => {
    vi.mocked(fn).mockResolvedValue({ value: absence, replayed: true } as never);
    const req = absenceRequest(action, body);
    const response = await absenceRoute()(req, ["absences", absenceId, action]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(absence);
    expect(fn).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({ actor, idempotencyKey: req.headers.get("idempotency-key") }),
      absenceId,
      body,
    );
  },
);
it.each(["appeal", "decision"])("requires a session for absence %s", async (action) => {
  const response = await absenceRoute(false)(absenceRequest(action, {}), [
    "absences",
    absenceId,
    action,
  ]);
  expect(response.status).toBe(401);
  expect(submitSchedulingAbsenceAppeal).not.toHaveBeenCalled();
  expect(decideSchedulingAbsence).not.toHaveBeenCalled();
});
it.each([
  { header: "x-csrf-token", status: 403, code: "CSRF_TOKEN_REQUIRED" },
  { header: "origin", status: 403, code: "ORIGIN_DENIED" },
  { header: "idempotency-key", status: 422, code: "IDEMPOTENCY_KEY_REQUIRED" },
])(
  "rejects absence mutation without $header before the domain",
  async ({ header, status, code }) => {
    const response = await absenceRoute()(absenceRequest("decision", decisionBody, header), [
      "absences",
      absenceId,
      "decision",
    ]);
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
    expect(decideSchedulingAbsence).not.toHaveBeenCalled();
  },
);
it.each([
  { action: "appeal", fn: submitSchedulingAbsenceAppeal, body: appealBody },
  { action: "decision", fn: decideSchedulingAbsence, body: decisionBody },
])("preserves server-side permission denial for $action", async ({ action, fn, body }) => {
  vi.mocked(fn).mockRejectedValue({ code: "PERMISSION_DENIED", status: 403 });
  const response = await absenceRoute()(absenceRequest(action, body), [
    "absences",
    absenceId,
    action,
  ]);
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ code: "PERMISSION_DENIED" });
});
it("preserves conflict responses from a stale decision version", async () => {
  vi.mocked(decideSchedulingAbsence).mockRejectedValue({ code: "VERSION_CONFLICT", status: 409 });
  const response = await absenceRoute()(absenceRequest("decision", decisionBody), [
    "absences",
    absenceId,
    "decision",
  ]);
  expect(response.status).toBe(409);
  expect(await response.json()).toMatchObject({ code: "VERSION_CONFLICT" });
});
it("returns actionable field errors when appeal evidence is missing", async () => {
  vi.mocked(submitSchedulingAbsenceAppeal).mockImplementation(
    async (_pool, _context, _id, body) => {
      schedulingAbsenceAppealSchema.parse(body);
      throw new Error("Expected validation failure");
    },
  );
  const response = await absenceRoute()(
    absenceRequest("appeal", { ...appealBody, evidenceFileIds: [] }),
    ["absences", absenceId, "appeal"],
  );
  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({
    code: "VALIDATION_FAILED",
    fields: [{ path: "evidenceFileIds" }],
  });
});
it("rejects caller-supplied authority and a missing decision version through the strict contract", async () => {
  vi.mocked(decideSchedulingAbsence).mockImplementation(async (_pool, _context, _id, body) => {
    schedulingAbsenceDecisionSchema.parse(body);
    throw new Error("Expected validation failure");
  });
  const response = await absenceRoute()(
    absenceRequest("decision", { outcome: "accepted", actorId: actor.userId }),
    ["absences", absenceId, "decision"],
  );
  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({
    code: "VALIDATION_FAILED",
    fields: expect.arrayContaining([{ path: "expectedVersion", code: "invalid_type" }]),
  });
});

it("gets the private review projection separately from the basic absence", async () => {
  vi.mocked(getSchedulingAbsenceReview).mockResolvedValue({
    id: absenceId,
    explanation: "Texto",
    evidence: [],
  } as never);
  const response = await absenceRoute()(
    new Request(`https://caab.test/api/v1/scheduling/absences/${absenceId}/review`),
    ["absences", absenceId, "review"],
  );
  expect(response.status).toBe(200);
  expect(getSchedulingAbsenceReview).toHaveBeenCalledWith(pool, actor, absenceId);
  expect(getSchedulingAbsence).not.toHaveBeenCalled();
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("requests a file grant through the scoped review service", async () => {
  const storage = {} as WebObjectStorage;
  const getStorage = vi.fn(() => storage);
  const fileId = crypto.randomUUID();
  const grant = {
    url: "https://caab.test/private/synthetic",
    expiresAt: "2026-09-28T16:00:00.000Z",
  };
  vi.mocked(getSchedulingAbsenceEvidenceDownload).mockResolvedValue(grant);
  const route = createSchedulingRoute({
    pool,
    resolveActor: async () => actor,
    afterResponse: vi.fn(),
    getStorage,
  });
  const response = await route(
    new Request(
      `https://caab.test/api/v1/scheduling/absences/${absenceId}/evidence?fileId=${fileId}`,
    ),
    ["absences", absenceId, "evidence"],
  );
  expect(response.status).toBe(200);
  expect(getSchedulingAbsenceEvidenceDownload).toHaveBeenCalledWith(
    pool,
    actor,
    absenceId,
    fileId,
    storage,
  );
  expect(await response.json()).toEqual({ ...grant, expiresAt: grant.expiresAt });
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it.each([
  "",
  "?fileId=invalid",
  `?fileId=${crypto.randomUUID()}&unrelated=1`,
  `?fileId=${crypto.randomUUID()}&fileId=${crypto.randomUUID()}`,
])("rejects invalid evidence query %s without issuing a grant", async (query) => {
  const getStorage = vi.fn();
  const route = createSchedulingRoute({
    pool,
    resolveActor: async () => actor,
    afterResponse: vi.fn(),
    getStorage,
  });
  const response = await route(
    new Request(`https://caab.test/api/v1/scheduling/absences/${absenceId}/evidence${query}`),
    ["absences", absenceId, "evidence"],
  );
  expect(response.status).toBe(422);
  expect(getStorage).not.toHaveBeenCalled();
  expect(getSchedulingAbsenceEvidenceDownload).not.toHaveBeenCalled();
});
it.each(["review", "evidence"])(
  "preserves the dedicated permission denial on %s",
  async (action) => {
    vi.mocked(getSchedulingAbsenceReview).mockRejectedValue({
      code: "PERMISSION_DENIED",
      status: 403,
    });
    vi.mocked(getSchedulingAbsenceEvidenceDownload).mockRejectedValue({
      code: "PERMISSION_DENIED",
      status: 403,
    });
    const route = createSchedulingRoute({
      pool,
      resolveActor: async () => actor,
      afterResponse: vi.fn(),
      getStorage: () => ({}) as WebObjectStorage,
    });
    const suffix = action === "evidence" ? `?fileId=${crypto.randomUUID()}` : "";
    const response = await route(
      new Request(`https://caab.test/api/v1/scheduling/absences/${absenceId}/${action}${suffix}`),
      ["absences", absenceId, action],
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "PERMISSION_DENIED" });
  },
);
it("does not accept unexpected review query fields", async () => {
  const response = await absenceRoute()(
    new Request(
      `https://caab.test/api/v1/scheduling/absences/${absenceId}/review?memberId=${crypto.randomUUID()}`,
    ),
    ["absences", absenceId, "review"],
  );
  expect(response.status).toBe(422);
  expect(getSchedulingAbsenceReview).not.toHaveBeenCalled();
});

function recordAbsenceRequest(body: unknown = { expectedVersion: 1 }, removeHeader?: string) {
  const headers = new Headers(request().headers);
  if (removeHeader) headers.delete(removeHeader);
  return new Request(`https://caab.test/api/v1/scheduling/bookings/${bookingId}/absence`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}
it.each([false, true])(
  "records an absence with replay=%s and no booking analytics",
  async (replayed) => {
    vi.mocked(recordSchedulingAbsence).mockResolvedValue({ value: absence, replayed } as never);
    const afterResponse = vi.fn();
    const route = createSchedulingRoute({ pool, resolveActor: async () => actor, afterResponse });
    const req = recordAbsenceRequest();
    const response = await route(req, ["bookings", bookingId, "absence"]);
    expect(response.status).toBe(replayed ? 200 : 201);
    expect(await response.json()).toEqual(absence);
    expect(recordSchedulingAbsence).toHaveBeenCalledWith(
      pool,
      expect.objectContaining({ actor, idempotencyKey: req.headers.get("idempotency-key") }),
      bookingId,
      { expectedVersion: 1 },
    );
    expect(afterResponse).not.toHaveBeenCalled();
    expect(createSchedulingBooking).not.toHaveBeenCalled();
  },
);
it.each([
  { code: "PERMISSION_DENIED", status: 403 },
  { code: "SCHEDULING_ABSENCE_BOOKING_STATE", status: 422 },
  { code: "VERSION_CONFLICT", status: 409 },
])("preserves recording refusal $code from the authoritative service", async ({ code, status }) => {
  vi.mocked(recordSchedulingAbsence).mockRejectedValue({ code, status });
  const response = await absenceRoute()(recordAbsenceRequest(), ["bookings", bookingId, "absence"]);
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({ code });
});
it("does not record an absence without a valid session", async () => {
  const response = await absenceRoute(false)(recordAbsenceRequest(), [
    "bookings",
    bookingId,
    "absence",
  ]);
  expect(response.status).toBe(401);
  expect(recordSchedulingAbsence).not.toHaveBeenCalled();
});
it.each([
  { header: "origin", status: 403 },
  { header: "x-csrf-token", status: 403 },
  { header: "idempotency-key", status: 422 },
])("does not record an absence without $header", async ({ header, status }) => {
  const response = await absenceRoute()(recordAbsenceRequest({ expectedVersion: 1 }, header), [
    "bookings",
    bookingId,
    "absence",
  ]);
  expect(response.status).toBe(status);
  expect(recordSchedulingAbsence).not.toHaveBeenCalled();
});
it.each([
  {},
  { expectedVersion: 1, actorId: actor.userId },
  { expectedVersion: 1, recordedAt: "2026-09-28T16:00:00Z" },
  { expectedVersion: 1, cancellationScope: "all_future" },
])("refuses unsupported recording fields %j", async (body) => {
  vi.mocked(recordSchedulingAbsence).mockImplementation(async (_pool, _context, _id, raw) => {
    schedulingAbsenceRecordSchema.parse(raw);
    throw new Error("Expected validation failure");
  });
  const response = await absenceRoute()(recordAbsenceRequest(body), [
    "bookings",
    bookingId,
    "absence",
  ]);
  expect(response.status).toBe(422);
  expect(await response.json()).toMatchObject({ code: "VALIDATION_FAILED" });
});

it("lists absence metadata through the authorized paginated domain", async () => {
  const page = { items: [], total: 3, page: 2, pageSize: 1 };
  vi.mocked(listSchedulingAbsences).mockResolvedValue(page);
  const response = await absenceRoute()(
    new Request(
      `https://caab.test/api/v1/scheduling/absences?bookingId=${bookingId}&page=2&pageSize=1&status=under_review&q=Pessoa`,
    ),
    ["absences"],
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(page);
  expect(listSchedulingAbsences).toHaveBeenCalledWith(pool, actor, {
    bookingId,
    page: "2",
    pageSize: "1",
    status: "under_review",
    q: "Pessoa",
  });
  expect(getSchedulingAbsenceReview).not.toHaveBeenCalled();
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("requires authentication before listing absences", async () => {
  const response = await absenceRoute(false)(
    new Request("https://caab.test/api/v1/scheduling/absences"),
    ["absences"],
  );
  expect(response.status).toBe(401);
  expect(listSchedulingAbsences).not.toHaveBeenCalled();
});
it("preserves a revoked list permission", async () => {
  vi.mocked(listSchedulingAbsences).mockRejectedValue({ code: "PERMISSION_DENIED", status: 403 });
  const response = await absenceRoute()(
    new Request("https://caab.test/api/v1/scheduling/absences"),
    ["absences"],
  );
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({ code: "PERMISSION_DENIED" });
});
it.each(["?status=expired", "?pageSize=101", "?memberId=bad", "?includeEvidence=true"])(
  "reports invalid list query %s",
  async (query) => {
    vi.mocked(listSchedulingAbsences).mockImplementation(async (_pool, _actor, raw) => {
      schedulingAbsenceQuerySchema.parse(raw);
      throw new Error("Expected validation failure");
    });
    const response = await absenceRoute()(
      new Request(`https://caab.test/api/v1/scheduling/absences${query}`),
      ["absences"],
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: "VALIDATION_FAILED" });
  },
);
it("rejects duplicate list filters before the query service", async () => {
  const response = await absenceRoute()(
    new Request("https://caab.test/api/v1/scheduling/absences?status=all&status=accepted"),
    ["absences"],
  );
  expect(response.status).toBe(422);
  expect(listSchedulingAbsences).not.toHaveBeenCalled();
});
