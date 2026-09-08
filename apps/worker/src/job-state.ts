export type JobState = "queued" | "running" | "succeeded" | "failed";
export type JobEvent = "start" | "retry" | "succeed" | "fail" | "redrive";

const transitions: Record<JobState, Partial<Record<JobEvent, JobState>>> = {
  queued: { start: "running" },
  running: { retry: "queued", succeed: "succeeded", fail: "failed" },
  succeeded: {},
  failed: { redrive: "queued" },
};

export function nextJobState(state: JobState, event: JobEvent): JobState {
  const next = transitions[state][event];
  if (!next) throw new Error(`Invalid job transition: ${state} -> ${event}`);
  return next;
}

export function safeJobFailure(error: unknown): { code: string; message: string } {
  void error;
  return { code: "JOB_FAILED", message: "The operation could not be completed" };
}
