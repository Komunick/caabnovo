import { describe, expect, it } from "vitest";
import { nextJobState, safeJobFailure } from "../src/job-state";

describe("job state machine", () => {
  it("accepts execution, retry, terminal completion and explicit redrive transitions", () => {
    expect(nextJobState("queued", "start")).toBe("running");
    expect(nextJobState("running", "retry")).toBe("queued");
    expect(nextJobState("running", "succeed")).toBe("succeeded");
    expect(nextJobState("running", "fail")).toBe("failed");
    expect(nextJobState("failed", "redrive")).toBe("queued");
  });

  it("rejects mutation of terminal jobs and invalid lifecycle jumps", () => {
    expect(() => nextJobState("queued", "succeed")).toThrow("Invalid job transition");
    expect(() => nextJobState("succeeded", "redrive")).toThrow("Invalid job transition");
  });

  it("maps arbitrary failures to allowlisted operational output", () => {
    const safe = safeJobFailure(
      new Error("password=Synthetic-Only-Password token=synthetic-token at internal.ts:42"),
    );
    expect(safe).toEqual({
      code: "JOB_FAILED",
      message: "The operation could not be completed",
    });
    expect(JSON.stringify(safe)).not.toMatch(/password|token|internal\.ts/i);
  });
});
