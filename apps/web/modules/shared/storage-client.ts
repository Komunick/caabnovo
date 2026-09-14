import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import type { ServerEnv } from "@caab/config";

export function createStorageClient(env: ServerEnv, browserFacing = false): S3Client {
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY)
    throw new Error("Legacy S3 storage is not configured");
  return new S3Client({
    endpoint: browserFacing ? (env.S3_PUBLIC_ENDPOINT ?? env.S3_ENDPOINT) : env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
  });
}
