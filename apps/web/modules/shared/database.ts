import "server-only";
import { createDatabaseClient } from "@caab/db";
import { loadServerEnv } from "@caab/config";

let database: ReturnType<typeof createDatabaseClient> | undefined;

export function getDatabase(): ReturnType<typeof createDatabaseClient> {
  if (!database) database = createDatabaseClient(loadServerEnv().DATABASE_URL);
  return database;
}
