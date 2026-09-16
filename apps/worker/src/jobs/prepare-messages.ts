import type { Pool } from "pg";
import { processScheduledMessages } from "@caab/db/repositories/messaging";
export const prepareScheduledMessages = (pool: Pool) => processScheduledMessages(pool);
