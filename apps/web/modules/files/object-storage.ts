import "server-only";
import { loadServerEnv } from "@caab/config";
import { getDatabase } from "../shared/database";
import {
  fileContentError,
  isDatabaseFile,
  inspectDatabaseContent,
} from "@caab/db/repositories/file-content";
import { signContentGrant } from "./content-grant";
import type { Pool } from "pg";

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
  readonly keyPrefix?: string;
  createQuarantineUpload(
    key: string,
    input: { contentType: string; sizeBytes: number; checksumSha256: string },
  ): Promise<UploadGrant>;
  inspectQuarantine(key: string): Promise<QuarantinedObjectMetadata | null>;
  createPrivateDownload(key: string): Promise<{ url: string; expiresAt: Date }>;
}

let storage: WebObjectStorage | undefined;

export class DatabaseWebObjectStorage implements WebObjectStorage {
  readonly keyPrefix = "database/";
  constructor(
    private readonly pool: Pool,
    private readonly origin: string,
    private readonly secret: string,
  ) {}

  async createQuarantineUpload(
    key: string,
    input: { contentType: string; sizeBytes: number; checksumSha256: string },
  ): Promise<UploadGrant> {
    if (!isDatabaseFile(key)) throw fileContentError("NOT_FOUND", 404);
    const grant = signContentGrant(this.secret, this.origin, key, "PUT");
    return {
      uploadUrl: grant.url,
      expiresAt: grant.expiresAt,
      requiredHeaders: { "content-type": input.contentType },
    };
  }
  async inspectQuarantine(key: string) {
    return isDatabaseFile(key) ? inspectDatabaseContent(this.pool, key) : null;
  }
  async createPrivateDownload(key: string) {
    if (!isDatabaseFile(key)) throw fileContentError("NOT_FOUND", 404);
    return signContentGrant(this.secret, this.origin, key, "GET");
  }
}

export function getObjectStorage(): WebObjectStorage {
  if (storage) return storage;
  const env = loadServerEnv();
  storage = new DatabaseWebObjectStorage(
    getDatabase().pool,
    env.BETTER_AUTH_URL,
    env.BETTER_AUTH_SECRET,
  );
  return storage;
}
