import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

export interface NewsDatabase {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>;
}
export type NewsRequest = { transactionID: string | number; context: { newsActorVerified: true } };

// Only domain services may enter here; their actor/action checks run in this transaction.
export async function withNewsDatabase<T>(
  payload: Payload,
  operation: (db: NewsDatabase, req: NewsRequest) => Promise<T>,
): Promise<T> {
  if (payload.db.name !== "postgres") throw new Error("News requires the PostgreSQL adapter");
  const transactionID = await payload.db.beginTransaction();
  if (transactionID === null) throw new Error("News requires database transactions");
  try {
    const adapter = payload.db as unknown as PostgresAdapter;
    const transaction = adapter.sessions[transactionID]?.db as
      Pick<PostgresAdapter["drizzle"], "execute"> | undefined;
    if (!transaction) throw new Error("News transaction was not initialized");
    const db: NewsDatabase = {
      async query<R extends Record<string, unknown>>(text: string, values: unknown[] = []) {
        const chunks = text
          .split(/\$(\d+)/)
          .map((part, index) =>
            index % 2 ? sql`${sql.param(values[Number(part) - 1])}` : sql.raw(part),
          );
        const result = await transaction.execute(sql.join(chunks, sql.raw("")));
        return { rows: result.rows as R[], rowCount: result.rowCount };
      },
    };
    const result = await operation(db, { transactionID, context: { newsActorVerified: true } });
    await payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID);
    throw error;
  }
}
