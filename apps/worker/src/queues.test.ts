import { describe, expect, it } from "vitest";
import { QUEUES, queueDefinitions } from "./queues";

describe("queue definitions", () => {
  it("creates the dead-letter queue before queues that depend on it", () => {
    expect(queueDefinitions[0]?.name).toBe(QUEUES.deadLetter);
    expect(
      queueDefinitions.slice(1).every(({ deadLetter }) => deadLetter === QUEUES.deadLetter),
    ).toBe(true);
  });
});
