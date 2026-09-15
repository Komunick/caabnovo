export interface WorkerObjectStorage {
  readQuarantine(key: string): Promise<Uint8Array>;
  quarantineExists(key: string): Promise<boolean>;
  privateExists(key: string): Promise<boolean>;
  promoteToPrivate(quarantineKey: string, objectKey: string): Promise<void>;
  deleteQuarantine(key: string): Promise<void>;
}
