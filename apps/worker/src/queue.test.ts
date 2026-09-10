import { describe, expect, it, vi } from "vitest";
const log = vi.hoisted(() => vi.fn());
vi.mock("./logger.js", () => ({ logger: { error: log } }));
import { createQueue } from "./queue";

describe("worker queue errors", () => {
  it("handles background errors without throwing or logging raw details", () => {
    const queue = createQueue("postgresql://synthetic:synthetic@localhost:1/test");
    expect(() => queue.emit("error", new Error("secret connection details"))).not.toThrow();
    expect(log).toHaveBeenCalledWith(
      { event: "queue.error", errorCode: "QUEUE_CONNECTION_ERROR" },
      "Queue connection failed",
    );
  });
});
