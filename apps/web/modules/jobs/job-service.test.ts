import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { listAuthorizedJobs, redriveJob } from "./job-service";
import { createJobRedriveRoute } from "./http/job-redrive-route";

const input = {
  jobId: crypto.randomUUID(),
  reason: "",
  requestId: crypto.randomUUID(),
  correlationId: crypto.randomUUID(),
  effectiveIdentity: "synthetic-test",
};
const actor = (permissions: string[]) => ({
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(permissions),
});

describe("job authorization before effects", () => {
  it.each([[], ["jobs:redrive"], ["jobs:read"]].map((permissions) => ({ permissions })))(
    "denies redrive with $permissions before connecting or enqueueing",
    async ({ permissions }) => {
      const connect = vi.fn();
      const query = vi.fn();
      const enqueue = vi.fn();
      await expect(
        redriveJob({ connect, query } as unknown as Pool, actor(permissions), input, { enqueue }),
      ).rejects.toMatchObject({ status: 403 });
      expect(connect).not.toHaveBeenCalled();
      expect(query).not.toHaveBeenCalled();
      expect(enqueue).not.toHaveBeenCalled();
    },
  );

  it("denies listing without querying", async () => {
    const query = vi.fn();
    await expect(
      listAuthorizedJobs({ query } as unknown as Pool, actor(["jobs:redrive"])),
    ).rejects.toMatchObject({ status: 403 });
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects an invalid cursor before querying", async () => {
    const query = vi.fn();
    await expect(
      listAuthorizedJobs({ query } as unknown as Pool, actor(["jobs:read"]), { cursor: "invalid" }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(query).not.toHaveBeenCalled();
  });

  it("denies the HTTP command before initializing its queue dependency", async () => {
    const redrive = vi.fn();
    const route = createJobRedriveRoute({
      resolveActor: async () => actor(["jobs:redrive"]),
      redrive,
    });
    const response = await route.POST(
      new Request("http://localhost/api/v1/jobs/test/redrive", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          "x-csrf-token": crypto.randomUUID(),
          "content-type": "application/json",
        },
        body: "{}",
      }),
      { params: Promise.resolve({ jobId: input.jobId }) },
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "PERMISSION_DENIED" });
    expect(redrive).not.toHaveBeenCalled();
  });
});
