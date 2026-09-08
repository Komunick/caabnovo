import "server-only";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { loadServerEnv } from "@caab/config";
import { recordStorageError, withServerSpan } from "../shared/metrics";

const SIGNED_URL_TTL_SECONDS = 300;

export interface UploadGrant {
  uploadUrl: string;
  expiresAt: Date;
  requiredHeaders: Record<string, string>;
}

export interface QuarantinedObjectMetadata {
  sizeBytes: number;
  checksumSha256?: string;
  contentType?: string;
}

export interface WebObjectStorage {
  createQuarantineUpload(
    key: string,
    input: { contentType: string; sizeBytes: number; checksumSha256: string },
  ): Promise<UploadGrant>;
  inspectQuarantine(key: string): Promise<QuarantinedObjectMetadata | null>;
  createPrivateDownload(key: string): Promise<{ url: string; expiresAt: Date }>;
}

export class S3WebObjectStorage implements WebObjectStorage {
  constructor(
    private readonly client: S3Client,
    private readonly quarantineBucket: string,
    private readonly privateBucket: string,
  ) {}

  async createQuarantineUpload(
    key: string,
    input: { contentType: string; sizeBytes: number; checksumSha256: string },
  ): Promise<UploadGrant> {
    return storageOperation("presign_upload", async () => {
      const checksumBase64 = Buffer.from(input.checksumSha256, "hex").toString("base64");
      const command = new PutObjectCommand({
        Bucket: this.quarantineBucket,
        Key: key,
        ContentType: input.contentType,
        ChecksumSHA256: checksumBase64,
      });
      const uploadUrl = await getSignedUrl(this.client, command, {
        expiresIn: SIGNED_URL_TTL_SECONDS,
      });
      return {
        uploadUrl,
        expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000),
        requiredHeaders: {
          "content-type": input.contentType,
          "x-amz-checksum-sha256": checksumBase64,
        },
      };
    });
  }

  async inspectQuarantine(key: string): Promise<QuarantinedObjectMetadata | null> {
    return storageOperation("head_quarantine", async () => {
      try {
        const object = await this.client.send(
          new HeadObjectCommand({
            Bucket: this.quarantineBucket,
            Key: key,
            ChecksumMode: "ENABLED",
          }),
        );
        return {
          sizeBytes: object.ContentLength ?? 0,
          ...(object.ChecksumSHA256 ? { checksumSha256: object.ChecksumSHA256 } : {}),
          ...(object.ContentType ? { contentType: object.ContentType } : {}),
        };
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    });
  }

  async createPrivateDownload(key: string): Promise<{ url: string; expiresAt: Date }> {
    return storageOperation("presign_download", async () => {
      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.privateBucket, Key: key }),
        { expiresIn: SIGNED_URL_TTL_SECONDS },
      );
      return { url, expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000) };
    });
  }
}

async function storageOperation<T>(operation: string, run: () => Promise<T>): Promise<T> {
  try {
    return await withServerSpan(`storage ${operation}`, { "storage.operation": operation }, run);
  } catch (error) {
    recordStorageError(operation);
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.name === "NotFound" || candidate.$metadata?.httpStatusCode === 404;
}

let storage: WebObjectStorage | undefined;

export function getObjectStorage(): WebObjectStorage {
  if (storage) return storage;
  const env = loadServerEnv();
  storage = new S3WebObjectStorage(
    new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: true,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
    }),
    env.S3_QUARANTINE_BUCKET,
    env.S3_PRIVATE_BUCKET,
  );
  return storage;
}
