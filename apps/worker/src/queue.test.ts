import { describe, expect, it, vi } from "vitest";
import { createQueue } from "./queue.js";
import { logger } from "./logger.js";

describe("worker queue resilience", () => {
  it("handles a polling error without terminating the worker or logging its payload", () => {
    const log = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    try {
      const boss = createQueue("postgresql://synthetic:synthetic@localhost/test");
      expect(() => boss.emit("error", new Error("private connection details"))).not.toThrow();
      expect(log).toHaveBeenCalledWith(
        { event: "queue.error", errorCode: "QUEUE_ERROR", outcome: "failure" },
        "Queue operation failed",
      );
      expect(JSON.stringify(log.mock.calls)).not.toContain("private connection details");
    } finally {
      log.mockRestore();
    }
  });
});
