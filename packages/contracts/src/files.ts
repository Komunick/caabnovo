import { z } from "zod";
import { idSchema, isoDateTimeSchema } from "./common";

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
export const uploadMimeSchema = z.enum(["application/pdf", "image/jpeg", "image/png"]);
export const checksumSha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const createUploadIntentRequestSchema = z.object({
  originalName: z.string().trim().min(1).max(255),
  declaredMime: uploadMimeSchema,
  sizeBytes: z.number().int().min(1).max(MAX_UPLOAD_SIZE_BYTES),
  checksumSha256: checksumSha256Schema,
  ownerType: z.string().trim().min(1).max(64),
  ownerId: z.string().trim().min(1).max(128),
});

export const uploadIntentSchema = z.object({
  fileId: idSchema,
  uploadUrl: z.url(),
  expiresAt: isoDateTimeSchema,
  requiredHeaders: z.record(z.string(), z.string()),
});

export const finalizeUploadRequestSchema = z.object({
  checksumSha256: checksumSha256Schema,
});

export const downloadGrantSchema = z.object({
  url: z.url(),
  expiresAt: isoDateTimeSchema,
});

export const fileScanJobPayloadSchema = z.object({
  schemaVersion: z.literal(1),
  jobId: idSchema,
  fileId: idSchema,
  correlationId: idSchema,
  requestId: idSchema,
});

export type CreateUploadIntentRequest = z.infer<typeof createUploadIntentRequestSchema>;
export type UploadIntent = z.infer<typeof uploadIntentSchema>;
export type FinalizeUploadRequest = z.infer<typeof finalizeUploadRequestSchema>;
export type DownloadGrant = z.infer<typeof downloadGrantSchema>;
export type FileScanJobPayload = z.infer<typeof fileScanJobPayloadSchema>;
