import "server-only";
import type { PoolClient } from "pg";
import {
  validateExportSelection,
  type ExportColumn,
  type ExportFilter,
  type ExportModule,
  type ExportRequest,
  type ExportScalar,
} from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";

export type ExportRow = { id: string; values: Record<string, ExportScalar> };
export type ExportAdapter = {
  module: ExportModule;
  dataset: string;
  label: string;
  permission: string;
  columns: ExportColumn[];
  filters: ExportFilter[];
  /** Explicitly declare whether all records share module-level authorization. */
  scope: "module" | "records";
  query(input: ExportRequest): { text: string; values: unknown[] };
  map(row: Record<string, unknown>): ExportRow;
  authorizeRecords?(
    db: PoolClient,
    actor: RequestActor,
    ids: readonly string[],
    input: ExportRequest,
  ): Promise<boolean>;
};

export class ExportError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number = 403,
  ) {
    super(code);
  }
}
export function authorizedCatalog(adapter: ExportAdapter, actor: RequestActor) {
  if (!actor.permissions.has("exports:generate") || !actor.permissions.has(adapter.permission))
    throw new ExportError("PERMISSION_DENIED");
  return {
    module: adapter.module,
    dataset: adapter.dataset,
    label: adapter.label,
    columns: adapter.columns.filter(
      (column) => !column.permission || actor.permissions.has(column.permission),
    ),
    filters: adapter.filters.filter(
      (filter) => !filter.permission || actor.permissions.has(filter.permission),
    ),
  };
}
export function authorizeExport(adapter: ExportAdapter, actor: RequestActor, input: ExportRequest) {
  const catalog = authorizedCatalog(adapter, actor);
  if (input.context?.source === "reports" && !actor.permissions.has("reports:read"))
    throw new ExportError("PERMISSION_DENIED");
  if (adapter.module !== input.module || adapter.dataset !== input.dataset)
    throw new ExportError("EXPORT_NOT_FOUND", 404);
  try {
    validateExportSelection(input, catalog);
  } catch {
    throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
  }
  return catalog;
}
/** Registration is code-owned; clients can never supply SQL or import an adapter. */
export function exportRegistry(adapters: readonly ExportAdapter[]) {
  const registry = new Map<string, ExportAdapter>();
  for (const adapter of adapters) {
    const key = `${adapter.module}:${adapter.dataset}`;
    if (registry.has(key) || (adapter.scope === "records" && !adapter.authorizeRecords))
      throw new Error("INVALID_EXPORT_ADAPTER");
    registry.set(key, adapter);
  }
  return (module: string, dataset: string) => {
    const adapter = registry.get(`${module}:${dataset}`);
    if (!adapter) throw new ExportError("EXPORT_NOT_FOUND", 404);
    return adapter;
  };
}
