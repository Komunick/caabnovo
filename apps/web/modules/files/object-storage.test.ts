import { describe, expect, it, vi } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";
import { S3WebObjectStorage } from "./object-storage";

describe("browser storage URLs", () => {
  it("signs uploads and downloads on the public endpoint and inspects on the private endpoint", async () => {
    const options = {
      region: "us-east-1",
      forcePathStyle: true,
      credentials: { accessKeyId: "synthetic", secretAccessKey: "synthetic" },
    };
    const internal = new S3Client({ ...options, endpoint: "http://storage:9000" });
    const external = new S3Client({ ...options, endpoint: "https://files.example.test" });
    const send = vi.spyOn(internal, "send").mockResolvedValue({ ContentLength: 12 } as never);
    const storage = new S3WebObjectStorage(internal, "quarantine", "private", external);
    try {
      const upload = await storage.createQuarantineUpload("quarantine/test", {
        contentType: "image/png",
        sizeBytes: 12,
        checksumSha256: "a".repeat(64),
      });
      const download = await storage.createPrivateDownload("private/test");
      for (const value of [upload.uploadUrl, download.url]) {
        const url = new URL(value);
        expect(url.origin).toBe("https://files.example.test");
        expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[a-f0-9]{64}$/);
      }
      expect(await storage.inspectQuarantine("quarantine/test")).toEqual({ sizeBytes: 12 });
      expect(send).toHaveBeenCalledOnce();
    } finally {
      internal.destroy();
      external.destroy();
    }
  });
});
