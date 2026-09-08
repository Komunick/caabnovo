import { describe, expect, it } from "vitest";
import { allowlistedLogFields } from "@caab/config/redaction";
import { safeJobFailure } from "../src/job-state";

const rawFailure = {
  password: "Synthetic-Worker-Password!",
  token: "synthetic-worker-token",
  cookie: "caab.session=synthetic-worker-cookie",
  email: "worker-person@example.test",
  stack: "Error at worker-internal.ts:42",
};

describe("worker redaction canaries", () => {
  it("converts arbitrary terminal errors to a fixed safe result", () => {
    const result = safeJobFailure(new Error(JSON.stringify(rawFailure)));
    expect(result).toEqual({
      code: "JOB_FAILED",
      message: "The operation could not be completed",
    });
    expect(JSON.stringify(result)).not.toMatch(/Synthetic-Worker|worker-person|worker-internal/);
  });

  it("allows operational identifiers while removing secrets, PII and stack", () => {
    const jobId = crypto.randomUUID();
    const output = allowlistedLogFields({
      event: "job.failed",
      outcome: "failure",
      jobId,
      errorCode: "JOB_FAILED",
      ...rawFailure,
    });
    expect(output).toEqual({
      event: "job.failed",
      outcome: "failure",
      jobId,
      errorCode: "JOB_FAILED",
    });
    expect(JSON.stringify(output)).not.toMatch(/Synthetic-Worker|worker-person|worker-internal/);
  });
});
