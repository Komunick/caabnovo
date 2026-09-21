import "server-only";
import { loadServerEnv } from "@caab/config";
import {
  beginExportOperation,
  findExportOperation,
  updateExportOperation,
} from "@caab/db/repositories/export-operations";
import { resolveRequestActor } from "../auth/request-actor";
import { getExportPools } from "./query";
import { lookupExport, prepareExport } from "./runtime";
import { createExportRoutes } from "./http";
export const exportRoutes = createExportRoutes({
  actor: resolveRequestActor,
  secret: () => loadServerEnv().BETTER_AUTH_SECRET,
  origin: () => new URL(loadServerEnv().BETTER_AUTH_URL).origin,
  lookup: lookupExport,
  prepare: prepareExport,
  failed: async (operation, code) => {
    const pool = getExportPools().control;
    await beginExportOperation(pool, operation);
    await updateExportOperation(pool, operation, "failed", { rows: 0, bytes: 0 }, code);
  },
  status: (actorId, id) => findExportOperation(getExportPools().control, actorId, id),
});
