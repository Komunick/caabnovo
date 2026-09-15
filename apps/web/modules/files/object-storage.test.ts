import { describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { DatabaseWebObjectStorage } from "./object-storage";
import { verifyContentGrant } from "./content-grant";

const secret = "synthetic-storage-secret-at-least-32-characters";
const storage = new DatabaseWebObjectStorage({} as Pool, "https://panel.example.test", secret);
const uploadInput = { contentType: "image/png", sizeBytes: 12, checksumSha256: "a".repeat(64) };

describe("browser storage URLs", () => {
  it("issues upload and download grants on the panel with the correct method and key", async () => {
    const upload = await storage.createQuarantineUpload("database/quarantine/test", uploadInput);
    const download = await storage.createPrivateDownload("database/private/test");
    expect(storage.keyPrefix).toBe("database/");
    expect(upload.requiredHeaders).toEqual({ "content-type": "image/png" });
    for (const [value, method, key] of [
      [upload.uploadUrl, "PUT", "database/quarantine/test"],
      [download.url, "GET", "database/private/test"],
    ]) {
      const url = new URL(value!);
      expect(url.origin).toBe("https://panel.example.test");
      expect(url.pathname).toBe("/api/v1/files/content");
      expect(verifyContentGrant(secret, url.searchParams.get("grant"), method!)).toBe(key);
      expect(() =>
        verifyContentGrant(secret, url.searchParams.get("grant"), method === "PUT" ? "GET" : "PUT"),
      ).toThrow();
    }
  });
  it("rejects obsolete keys without signing a link or querying an external backend", async () => {
    await expect(
      storage.createQuarantineUpload("quarantine/test", uploadInput),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(storage.createPrivateDownload("private/test")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
    expect(await storage.inspectQuarantine("quarantine/test")).toBeNull();
  });
});
