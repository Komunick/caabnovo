import type { Pool } from "pg";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowlistedLogFields } from "@caab/config/redaction";
import {
  processExpiredSchedulingAbsences,
  SchedulingAbsenceFinalizationError,
} from "@caab/db/repositories/scheduling-absence-finalization";
import { registerSchedulingAbsenceFinalization } from "./finalize-absences";
import { QUEUES, queueDefinitions } from "../queues";
import { logger } from "../logger";

vi.mock("@caab/db/repositories/scheduling-absence-finalization", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@caab/db/repositories/scheduling-absence-finalization")
  >()),
  processExpiredSchedulingAbsences: vi.fn(),
}));
vi.mock("../logger.js", () => ({ logger: { error: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

async function register() {
  const pool = {} as Pool;
  let execute: () => Promise<void> = async () => {};
  const work = vi.fn(async (_name, handler) => {
    execute = handler;
    return "worker-id";
  });
  const schedule = vi.fn(async () => {});
  await registerSchedulingAbsenceFinalization(
    { work, schedule } as unknown as Parameters<typeof registerSchedulingAbsenceFinalization>[0],
    pool,
  );
  return { pool, execute, work, schedule };
}

describe("automatic absence deadline scheduling", () => {
  it("registers a minute sweep, awaits completion and propagates failures for queue retry", async () => {
    const { pool, execute, work, schedule } = await register();
    expect(work).toHaveBeenCalledWith(QUEUES.schedulingAbsenceFinalization, expect.any(Function));
    expect(schedule).toHaveBeenCalledWith(QUEUES.schedulingAbsenceFinalization, "* * * * *", {});
    vi.mocked(processExpiredSchedulingAbsences).mockResolvedValueOnce({
      finalized: 1,
      cancelled: 2,
    });
    await execute();
    expect(processExpiredSchedulingAbsences).toHaveBeenCalledWith(pool);
    expect(logger.error).not.toHaveBeenCalled();
    const unavailable = new Error("database unavailable");
    vi.mocked(processExpiredSchedulingAbsences).mockRejectedValueOnce(unavailable);
    await expect(execute()).rejects.toBe(unavailable);
    expect(
      queueDefinitions.find((entry) => entry.name === QUEUES.schedulingAbsenceFinalization),
    ).toMatchObject({ retryLimit: 4, deadLetter: QUEUES.deadLetter });
  });

  it("logs both occurrence causes safely and rethrows the original error for retry", async () => {
    const { execute } = await register();
    const canary = "secretcanary password=private-token email=private@example.test";
    const causes = [
      Object.assign(new Error(canary), { code: "23514", detail: canary }),
      Object.assign(new Error(canary, { cause: new Error(canary) }), { code: "57014" }),
    ];
    const failures = causes.map((cause) => ({ absenceId: crypto.randomUUID(), cause }));
    const error = new SchedulingAbsenceFinalizationError(failures);
    vi.mocked(processExpiredSchedulingAbsences).mockRejectedValueOnce(error);

    await expect(execute()).rejects.toBe(error);
    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(error.failures[0]!.cause).toBe(causes[0]);
    expect(error.failures[1]!.cause).toBe(causes[1]);
    expect(error.cause).toBeInstanceOf(AggregateError);
    expect((error.cause as AggregateError).errors).toEqual(causes);
    const output = vi
      .mocked(logger.error)
      .mock.calls.map(([fields, message]) =>
        allowlistedLogFields({ ...(fields as Record<string, unknown>), msg: message }),
      );
    expect(output).toEqual([
      {
        event: "scheduling.absence.finalization_failed",
        correlationId: failures[0]!.absenceId,
        errorCode: "23514",
        msg: "Uma restrição do banco impediu a finalização da falta.",
      },
      {
        event: "scheduling.absence.finalization_failed",
        correlationId: failures[1]!.absenceId,
        errorCode: "57014",
        msg: "A finalização da falta foi interrompida por cancelamento ou limite de tempo.",
      },
    ]);
    expect(JSON.stringify(output)).not.toMatch(
      /secretcanary|private-token|private@example|stack|detail/,
    );
  });

  it.each([
    ["40001", "Um conflito de transação impediu a finalização da falta."],
    ["08006", "Uma falha de conexão com o banco impediu a finalização da falta."],
    ["P0001", "Uma regra do banco interrompeu a finalização da falta."],
  ])("classifies SQLSTATE %s without exposing its raw message", async (code, message) => {
    const { execute } = await register();
    const absenceId = crypto.randomUUID();
    const error = new SchedulingAbsenceFinalizationError([
      { absenceId, cause: Object.assign(new Error("secretcanary"), { code }) },
    ]);
    vi.mocked(processExpiredSchedulingAbsences).mockRejectedValueOnce(error);
    await expect(execute()).rejects.toBe(error);
    expect(logger.error).toHaveBeenCalledWith(
      {
        event: "scheduling.absence.finalization_failed",
        correlationId: absenceId,
        errorCode: code,
      },
      message,
    );
  });

  it.each([
    null,
    "secretcanary",
    { code: "secretcanary" },
    { code: "23514\nsecretcanary" },
    { code: 23514 },
  ])("does not log arbitrary thrown values or unvalidated codes: %j", async (cause) => {
    const { execute } = await register();
    const absenceId = crypto.randomUUID();
    const error = new SchedulingAbsenceFinalizationError([{ absenceId, cause }]);
    vi.mocked(processExpiredSchedulingAbsences).mockRejectedValueOnce(error);
    await expect(execute()).rejects.toBe(error);
    expect(logger.error).toHaveBeenCalledWith(
      {
        event: "scheduling.absence.finalization_failed",
        correlationId: absenceId,
        errorCode: "UNKNOWN_ERROR",
      },
      "Não foi possível finalizar a falta; consulte o código e a correlação da falha.",
    );
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain("secretcanary");
  });

  it("keeps causes in memory but serializes only safe diagnostics for pg-boss persistence", async () => {
    const localRequire = createRequire(import.meta.url);
    const bossRequire = createRequire(localRequire.resolve("pg-boss"));
    // Exercise pg-boss's installed serializer without adding a direct dependency.
    const { serializeError } = (await import(
      pathToFileURL(bossRequire.resolve("serialize-error")).href
    )) as {
      serializeError(value: unknown): unknown;
    };
    const cause = Object.assign(
      new Error("secretcanary", { cause: new Error("nested-secretcanary") }),
      {
        code: "23514",
        detail: "secretcanary",
        query: "secretcanary",
        stack: "secretcanary",
      },
    );
    const absenceId = crypto.randomUUID();
    const error = new SchedulingAbsenceFinalizationError([{ absenceId, cause }]);
    for (const serialized of [JSON.parse(JSON.stringify(error)), serializeError(error)]) {
      expect(serialized).toMatchObject({
        code: "SCHEDULING_ABSENCE_FINALIZATION_FAILED",
        failures: [{ absenceId, errorCode: "23514" }],
      });
      expect(JSON.stringify(serialized)).not.toMatch(/secretcanary|cause|stack|query|detail/);
    }
    expect(error.failures[0]!.cause).toBe(cause);
    expect((error.cause as AggregateError).errors[0]).toBe(cause);
  });
});
