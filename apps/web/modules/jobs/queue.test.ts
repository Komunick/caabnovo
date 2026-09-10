import { describe, expect, it, vi } from "vitest";
const log = vi.hoisted(() => vi.fn());
vi.mock("../shared/logger", () => ({ logger: { error: log } }));
vi.mock("@caab/config", () => ({
  loadServerEnv: () => ({ DATABASE_URL: "postgresql://synthetic:synthetic@localhost:1/test" }),
}));
import { PgBoss } from "pg-boss";
import { getJobQueue } from "./queue";

describe("web queue errors", () => {
  it("handles errors from the background queue without throwing or logging raw details", async () => {
    const start = vi.spyOn(PgBoss.prototype, "start").mockImplementation(async function (
      this: PgBoss,
    ) {
      return this;
    });
    const create = vi.spyOn(PgBoss.prototype, "createQueue").mockResolvedValue(undefined as never);
    try {
      const queue = await getJobQueue();
      expect(() => queue.emit("error", new Error("secret connection details"))).not.toThrow();
      expect(log).toHaveBeenCalledWith(
        { event: "queue.error", errorCode: "QUEUE_CONNECTION_ERROR" },
        "Queue connection failed",
      );
    } finally {
      start.mockRestore();
      create.mockRestore();
    }
  });
});
