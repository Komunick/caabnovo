import { createHash } from "node:crypto";
import { extname } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import type { Pool } from "pg";
import { fileScanJobPayloadSchema, type FileScanJobPayload } from "@caab/contracts";
import type { WorkerObjectStorage } from "../object-storage.js";
import { recordScannerFailure } from "../metrics.js";

export const DEFAULT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const allowedTypes = new Map([
  ["application/pdf", new Set([".pdf"])],
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
]);

export interface VirusScanner {
  scan(body: Uint8Array): Promise<"clean" | "infected">;
}

export interface FileInspectionInput {
  body: Uint8Array;
  originalName: string;
  declaredMime: string;
  expectedSizeBytes: number;
  expectedChecksumSha256: string;
  maxSizeBytes?: number;
  scanner: VirusScanner;
}

export type FileInspectionResult =
  | {
      disposition: "promote";
      detectedMime: string;
      sizeBytes: number;
      checksumSha256: string;
    }
  | {
      disposition: "reject";
      reason: "mime_mismatch" | "size_exceeded" | "checksum_mismatch" | "infected";
      detectedMime?: string;
      sizeBytes: number;
      checksumSha256: string;
    }
  | {
      disposition: "retry";
      reason: "scanner_unavailable";
      detectedMime: string;
      sizeBytes: number;
      checksumSha256: string;
    };

export async function inspectAndScanFile(
  input: FileInspectionInput,
): Promise<FileInspectionResult> {
  const sizeBytes = input.body.byteLength;
  const checksumSha256 = createHash("sha256").update(input.body).digest("hex");
  const maxSizeBytes = input.maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;

  if (sizeBytes > maxSizeBytes || input.expectedSizeBytes !== sizeBytes) {
    return { disposition: "reject", reason: "size_exceeded", sizeBytes, checksumSha256 };
  }
  if (input.expectedChecksumSha256 !== checksumSha256) {
    return { disposition: "reject", reason: "checksum_mismatch", sizeBytes, checksumSha256 };
  }

  const detected = await fileTypeFromBuffer(input.body);
  const detectedMime = detected?.mime;
  const allowedExtensions = detectedMime ? allowedTypes.get(detectedMime) : undefined;
  if (
    !detectedMime ||
    !allowedExtensions ||
    input.declaredMime.toLowerCase() !== detectedMime ||
    !allowedExtensions.has(extname(input.originalName).toLowerCase())
  ) {
    return {
      disposition: "reject",
      reason: "mime_mismatch",
      ...(detectedMime ? { detectedMime } : {}),
      sizeBytes,
      checksumSha256,
    };
  }

  try {
    const result = await input.scanner.scan(input.body);
    if (result === "infected") {
      return {
        disposition: "reject",
        reason: "infected",
        detectedMime,
        sizeBytes,
        checksumSha256,
      };
    }
  } catch {
    recordScannerFailure("unavailable");
    return {
      disposition: "retry",
      reason: "scanner_unavailable",
      detectedMime,
      sizeBytes,
      checksumSha256,
    };
  }

  return { disposition: "promote", detectedMime, sizeBytes, checksumSha256 };
}

export async function runFileScan(
  pool: Pool,
  storage: WorkerObjectStorage,
  scanner: VirusScanner,
  untrustedPayload: FileScanJobPayload,
): Promise<FileInspectionResult | { disposition: "noop" }> {
  const payload = fileScanJobPayloadSchema.parse(untrustedPayload);
  const claimed = await pool.query<{
    quarantine_key: string;
    original_name: string;
    declared_mime: string;
    size_bytes: string;
    checksum_sha256: string;
  }>(
    `UPDATE stored_file SET status = 'scanning', updated_at = now()
     WHERE id = $1 AND (
       status IN ('uploaded', 'scan_error') OR
       (status = 'scanning' AND updated_at < now() - interval '2 minutes')
     )
     RETURNING quarantine_key, original_name, declared_mime, size_bytes::text, checksum_sha256`,
    [payload.fileId],
  );
  const file = claimed.rows[0];
  if (!file) {
    const terminal = await pool.query<{ status: string }>(
      "SELECT status::text FROM stored_file WHERE id = $1",
      [payload.fileId],
    );
    if (["scanning", "available", "rejected", "deleted"].includes(terminal.rows[0]?.status ?? "")) {
      return { disposition: "noop" };
    }
    throw new Error("File is not ready for scanning");
  }

  let body: Uint8Array;
  try {
    body = await storage.readQuarantine(file.quarantine_key);
  } catch (error) {
    await markScanError(pool, payload.fileId);
    throw new Error("Quarantined object unavailable", { cause: error });
  }
  const result = await inspectAndScanFile({
    body,
    originalName: file.original_name,
    declaredMime: file.declared_mime,
    expectedSizeBytes: Number(file.size_bytes),
    expectedChecksumSha256: file.checksum_sha256,
    scanner,
  });

  if (result.disposition === "retry") {
    await markScanError(pool, payload.fileId, result.detectedMime);
    throw new Error("Antivirus scanner unavailable");
  }
  if (result.disposition === "reject") {
    await pool.query(
      `UPDATE stored_file SET status = 'rejected', scan_result = $2,
       detected_mime = COALESCE($3, detected_mime), updated_at = now()
       WHERE id = $1 AND status = 'scanning'`,
      [
        payload.fileId,
        result.reason === "infected" ? "infected" : "error",
        result.detectedMime ?? null,
      ],
    );
    return result;
  }
  await pool.query(
    `UPDATE stored_file SET scan_result = 'clean', detected_mime = $2, size_bytes = $3,
     checksum_sha256 = $4, updated_at = now() WHERE id = $1 AND status = 'scanning'`,
    [payload.fileId, result.detectedMime, result.sizeBytes, result.checksumSha256],
  );
  return result;
}

async function markScanError(pool: Pool, fileId: string, detectedMime?: string): Promise<void> {
  await pool.query(
    `UPDATE stored_file SET status = 'scan_error', scan_result = 'error',
     detected_mime = COALESCE($2, detected_mime), updated_at = now()
     WHERE id = $1 AND status = 'scanning'`,
    [fileId, detectedMime ?? null],
  );
}
