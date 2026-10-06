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
  /** Extra permissions the actor must also hold (e.g. reports:read for report sources). */
  requires?: readonly string[];
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
  if (
    !actor.permissions.has("exports:generate") ||
    !actor.permissions.has(adapter.permission) ||
    adapter.requires?.some((permission) => !actor.permissions.has(permission))
  )
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
/** True when the request names a filter/column/sort key that exists but needs a permission the actor lacks. */
function selectsRestrictedItem(adapter: ExportAdapter, actor: RequestActor, input: ExportRequest) {
  const restricted = (item: { permission?: string }) =>
    item.permission !== undefined && !actor.permissions.has(item.permission);
  const columnKeys = new Set([...input.columns, ...input.sort.map((sort) => sort.field)]);
  return (
    adapter.filters.some(
      (filter) => Object.hasOwn(input.filters, filter.key) && restricted(filter),
    ) || adapter.columns.some((column) => columnKeys.has(column.key) && restricted(column))
  );
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
    // The catalog above already hides what the actor may not use, so a selection that still names
    // a filter, column or sort field the adapter restricts is an access change, not a bad
    // configuration. Still denied; only the diagnosis (403 instead of 422) differs.
    if (selectsRestrictedItem(adapter, actor, input)) throw new ExportError("PERMISSION_DENIED");
    throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
  }
  // Validate adapter-specific filters before opening the download stream.
  adapter.query(input);
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
