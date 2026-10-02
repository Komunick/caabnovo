import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { processExpiredSchedulingAbsences } from "@caab/db/repositories/scheduling-absence-finalization";
import { registerSchedulingAbsenceFinalization } from "./finalize-absences";
import { QUEUES, queueDefinitions } from "../queues";

vi.mock("@caab/db/repositories/scheduling-absence-finalization", () => ({
  processExpiredSchedulingAbsences: vi.fn(),
}));

describe("automatic absence deadline scheduling", () => {
  it("registers a minute sweep, awaits completion and propagates failures for queue retry", async () => {
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
    expect(work).toHaveBeenCalledWith(QUEUES.schedulingAbsenceFinalization, expect.any(Function));
    expect(schedule).toHaveBeenCalledWith(QUEUES.schedulingAbsenceFinalization, "* * * * *", {});
    vi.mocked(processExpiredSchedulingAbsences).mockResolvedValueOnce({
      finalized: 1,
      cancelled: 2,
    });
    await execute();
    expect(processExpiredSchedulingAbsences).toHaveBeenCalledWith(pool);
    vi.mocked(processExpiredSchedulingAbsences).mockRejectedValueOnce(
      new Error("database unavailable"),
    );
    await expect(execute()).rejects.toThrow("database unavailable");
    expect(
      queueDefinitions.find((entry) => entry.name === QUEUES.schedulingAbsenceFinalization),
    ).toMatchObject({ retryLimit: 4, deadLetter: QUEUES.deadLetter });
  });
});
