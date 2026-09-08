import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { recordStorageFailure, withWorkerSpan } from "./metrics.js";

export interface WorkerObjectStorage {
  readQuarantine(key: string): Promise<Uint8Array>;
  quarantineExists(key: string): Promise<boolean>;
  privateExists(key: string): Promise<boolean>;
  promoteToPrivate(quarantineKey: string, objectKey: string): Promise<void>;
  deleteQuarantine(key: string): Promise<void>;
}

export class S3WorkerObjectStorage implements WorkerObjectStorage {
  constructor(
    private readonly client: S3Client,
    private readonly quarantineBucket: string,
    private readonly privateBucket: string,
  ) {}

  async readQuarantine(key: string): Promise<Uint8Array> {
    return storageOperation("read_quarantine", async () => {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.quarantineBucket, Key: key }),
      );
      if (!response.Body) throw new Error("Quarantined object has no body");
      return response.Body.transformToByteArray();
    });
  }

  quarantineExists(key: string): Promise<boolean> {
    return this.exists(this.quarantineBucket, key);
  }

  privateExists(key: string): Promise<boolean> {
    return this.exists(this.privateBucket, key);
  }

  async promoteToPrivate(quarantineKey: string, objectKey: string): Promise<void> {
    await storageOperation("promote_private", async () => {
      const source = `${this.quarantineBucket}/${quarantineKey}`
        .split("/")
        .map(encodeURIComponent)
        .join("/");
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.privateBucket,
          Key: objectKey,
          CopySource: source,
        }),
      );
      await this.deleteQuarantine(quarantineKey);
    });
  }

  async deleteQuarantine(key: string): Promise<void> {
    await storageOperation("delete_quarantine", async () => {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.quarantineBucket, Key: key }));
    });
  }

  private async exists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  }
}

async function storageOperation<T>(operation: string, run: () => Promise<T>): Promise<T> {
  try {
    return await withWorkerSpan(`storage ${operation}`, { "storage.operation": operation }, run);
  } catch (error) {
    recordStorageFailure(operation);
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.name === "NotFound" || candidate.$metadata?.httpStatusCode === 404;
}
