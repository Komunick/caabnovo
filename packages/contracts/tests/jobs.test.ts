import { describe, expect, it } from "vitest";
import { jobListQuerySchema } from "../src/jobs";

describe("job list query", () => {
  it("defaults to 25 records and accepts all current states and unknown historical types", () => {
    expect(jobListQuerySchema.parse({})).toEqual({ limit: 25 });
    for (const status of ["queued", "running", "succeeded", "failed"]) {
      expect(
        jobListQuerySchema.parse({ status, jobType: "legacy-job", limit: "100" }),
      ).toMatchObject({ status, jobType: "legacy-job", limit: 100 });
    }
  });
  it("retains timestamp microseconds in continuation cursors", () => {
    const cursor = `2026-09-15T10:00:00.123456Z|${crypto.randomUUID()}`;
    expect(jobListQuerySchema.parse({ cursor }).cursor).toBe(cursor);
  });
  it.each([
    { limit: 0 },
    { limit: 101 },
    { limit: 1.5 },
    { limit: "NaN" },
    { status: "unknown" },
    { status: ["failed", "running"] },
    { jobType: "a".repeat(101) },
    { cursor: "invalid" },
    { cursor: `2026-02-30T10:00:00.123456Z|${crypto.randomUUID()}` },
  ])("rejects malformed query %j", (query) => {
    expect(jobListQuerySchema.safeParse(query).success).toBe(false);
  });
});
