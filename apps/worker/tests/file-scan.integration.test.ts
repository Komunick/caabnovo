import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { inspectAndScanFile, type VirusScanner } from "../src/jobs/scan-file";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function checksum(body: Uint8Array): string {
  return createHash("sha256").update(body).digest("hex");
}

function scanner(result: "clean" | "infected" = "clean"): VirusScanner {
  return { scan: vi.fn().mockResolvedValue(result) };
}

function validInput(overrides: Partial<Parameters<typeof inspectAndScanFile>[0]> = {}) {
  return {
    body: png,
    originalName: "evidence.png",
    declaredMime: "image/png",
    expectedSizeBytes: png.byteLength,
    expectedChecksumSha256: checksum(png),
    scanner: scanner(),
    ...overrides,
  };
}

describe("quarantined file inspection", () => {
  it("approves only a matching signature, MIME, size, checksum and clean scan", async () => {
    await expect(inspectAndScanFile(validInput())).resolves.toMatchObject({
      disposition: "promote",
      detectedMime: "image/png",
      sizeBytes: png.byteLength,
      checksumSha256: checksum(png),
    });
  });

  it("rejects a declared MIME that differs from the detected signature", async () => {
    const antivirus = scanner();
    await expect(
      inspectAndScanFile(validInput({ declaredMime: "application/pdf", scanner: antivirus })),
    ).resolves.toMatchObject({ disposition: "reject", reason: "mime_mismatch" });
    expect(antivirus.scan).not.toHaveBeenCalled();
  });

  it("rejects an object over the configured size before antivirus", async () => {
    const antivirus = scanner();
    await expect(
      inspectAndScanFile(
        validInput({
          expectedSizeBytes: png.byteLength,
          maxSizeBytes: png.byteLength - 1,
          scanner: antivirus,
        }),
      ),
    ).resolves.toMatchObject({ disposition: "reject", reason: "size_exceeded" });
    expect(antivirus.scan).not.toHaveBeenCalled();
  });

  it("rejects metadata or content checksum divergence", async () => {
    const antivirus = scanner();
    await expect(
      inspectAndScanFile(
        validInput({ expectedChecksumSha256: "0".repeat(64), scanner: antivirus }),
      ),
    ).resolves.toMatchObject({ disposition: "reject", reason: "checksum_mismatch" });
    expect(antivirus.scan).not.toHaveBeenCalled();
  });

  it("rejects an infected object and never promotes it", async () => {
    await expect(
      inspectAndScanFile(validInput({ scanner: scanner("infected") })),
    ).resolves.toMatchObject({ disposition: "reject", reason: "infected" });
  });

  it("fails closed when the scanner is unavailable", async () => {
    const unavailable: VirusScanner = {
      scan: vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED synthetic-scanner")),
    };
    await expect(inspectAndScanFile(validInput({ scanner: unavailable }))).resolves.toMatchObject({
      disposition: "retry",
      reason: "scanner_unavailable",
    });
  });
});
