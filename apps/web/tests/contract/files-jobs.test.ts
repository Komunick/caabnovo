import { describe, expect, it, vi } from "vitest";
import {
  MAX_UPLOAD_SIZE_BYTES,
  createUploadIntentRequestSchema,
  downloadGrantSchema,
  jobReferenceSchema,
  jobSchema,
  uploadIntentSchema,
} from "@caab/contracts";
import { createUploadIntentRoute } from "../../modules/files/http/upload-intent-route";
import { createFinalizeUploadRoute } from "../../modules/files/http/finalize-upload-route";
import { createDownloadRoute } from "../../modules/files/http/download-route";
import { createJobStatusRoute } from "../../modules/jobs/http/job-status-route";

const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(["files:create", "files:read", "jobs:read"]),
  mfaVerified: true,
};
const requestHeaders = {
  "content-type": "application/json",
  origin: "https://caab.example.test",
  "x-csrf-token": crypto.randomUUID(),
  "idempotency-key": "synthetic-file-upload-0001",
};

describe("file and job contracts", () => {
  it("validates an allowlisted bounded upload and rejects unsafe metadata", () => {
    const valid = {
      originalName: "evidence.png",
      declaredMime: "image/png",
      sizeBytes: 128,
      checksumSha256: "a".repeat(64),
      ownerType: "case",
      ownerId: crypto.randomUUID(),
    };
    expect(createUploadIntentRequestSchema.parse(valid)).toEqual(valid);
    expect(
      createUploadIntentRequestSchema.safeParse({
        ...valid,
        sizeBytes: MAX_UPLOAD_SIZE_BYTES + 1,
      }).success,
    ).toBe(false);
    expect(
      createUploadIntentRequestSchema.safeParse({ ...valid, checksumSha256: "not-a-checksum" })
        .success,
    ).toBe(false);
  });

  it("creates an upload intent and blocks an unauthenticated request", async () => {
    const fileId = crypto.randomUUID();
    const intent = uploadIntentSchema.parse({
      fileId,
      uploadUrl: "https://storage.example.test/quarantine",
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      requiredHeaders: { "content-type": "image/png" },
    });
    const create = vi.fn().mockResolvedValue(intent);
    const route = createUploadIntentRoute({ resolveActor: async () => actor, create });
    const response = await route.POST(
      new Request("https://caab.example.test/api/v1/files/upload-intents", {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          originalName: "evidence.png",
          declaredMime: "image/png",
          sizeBytes: 128,
          checksumSha256: "a".repeat(64),
          ownerType: "case",
          ownerId: crypto.randomUUID(),
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(uploadIntentSchema.parse(await response.json())).toEqual(intent);

    const denied = createUploadIntentRoute({ resolveActor: async () => null, create });
    expect(
      (
        await denied.POST(
          new Request("https://caab.example.test/api/v1/files/upload-intents", {
            method: "POST",
            headers: requestHeaders,
            body: "{}",
          }),
        )
      ).status,
    ).toBe(401);
  });

  it("returns contract-valid finalize, download and safe job status responses", async () => {
    const fileId = crypto.randomUUID();
    const jobId = crypto.randomUUID();
    const finalized = { jobId, statusUrl: `/api/v1/jobs/${jobId}` };
    const finalize = createFinalizeUploadRoute({
      resolveActor: async () => actor,
      finalize: async () => finalized,
    });
    const finalizeResponse = await finalize.POST(
      new Request(`https://caab.example.test/api/v1/files/${fileId}/finalize`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({ checksumSha256: "a".repeat(64) }),
      }),
      { params: Promise.resolve({ fileId }) },
    );
    expect(finalizeResponse.status).toBe(202);
    expect(jobReferenceSchema.parse(await finalizeResponse.json())).toEqual(finalized);

    const grant = {
      url: "https://storage.example.test/private",
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    };
    const download = createDownloadRoute({
      resolveActor: async () => actor,
      createGrant: async () => grant,
    });
    const downloadResponse = await download.GET(
      new Request(`https://caab.example.test/api/v1/files/${fileId}/download`),
      { params: Promise.resolve({ fileId }) },
    );
    expect(downloadResponse.status).toBe(200);
    expect(downloadGrantSchema.parse(await downloadResponse.json())).toEqual(grant);

    const job = {
      id: jobId,
      jobType: "file-scan",
      status: "failed" as const,
      progress: 45,
      attemptCount: 4,
      safeErrorCode: "JOB_FAILED",
      safeErrorMessage: "The operation could not be completed",
      createdAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      correlationId: crypto.randomUUID(),
    };
    const statusRoute = createJobStatusRoute({
      resolveActor: async () => actor,
      find: async () => job,
    });
    const statusResponse = await statusRoute.GET(
      new Request(`https://caab.example.test/api/v1/jobs/${jobId}`),
      { params: Promise.resolve({ jobId }) },
    );
    expect(statusResponse.status).toBe(200);
    const jobResponse = await statusResponse.json();
    expect(jobSchema.parse(jobResponse)).toEqual(job);
    expect(JSON.stringify(jobResponse)).not.toMatch(/stack|password|token/i);
  });
});
