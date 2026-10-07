import { describe, expect, it } from "vitest";
import { exportRequestSchema, type ExportRequest } from "@caab/contracts";
import { authorizeExport, type ExportAdapter } from "./catalog";

const adapter: ExportAdapter = {
  module: "users",
  dataset: "synthetic",
  label: "Sintético",
  permission: "users:read",
  scope: "module",
  columns: [
    { key: "name", label: "Nome", scalarType: "text", defaultSelected: true, sortable: true },
    {
      key: "roles",
      label: "Funções",
      scalarType: "text",
      defaultSelected: false,
      sortable: false,
      permission: "roles:read",
    },
  ],
  filters: [
    { key: "search", label: "Busca", type: "text" },
    { key: "secret", label: "Restrito", type: "text", permission: "secret:read" },
  ],
  query: () => ({ text: "SELECT 1", values: [] }),
  map: (row) => ({ id: String(row.id), values: {} }),
};
const actor = (...extra: string[]) => ({
  userId: "synthetic",
  sessionId: "synthetic",
  permissions: new Set(["users:read", "exports:generate", ...extra]),
});
const request = (patch: Partial<ExportRequest> = {}) =>
  exportRequestSchema.parse({
    module: "users",
    dataset: "synthetic",
    columns: ["name"],
    format: "csv",
    ...patch,
  });
const denied = { code: "PERMISSION_DENIED", status: 403 };
const invalid = { code: "EXPORT_CONFIGURATION_INVALID", status: 422 };

describe("authorizeExport diagnosis of permission-restricted selections", () => {
  it("reports a lost filter permission as PERMISSION_DENIED (403)", () => {
    const input = request({ filters: { secret: "x" } });
    expect(() => authorizeExport(adapter, actor(), input)).toThrow(expect.objectContaining(denied));
  });
  it("reports a lost column or sort permission as PERMISSION_DENIED (403)", () => {
    expect(() =>
      authorizeExport(adapter, actor(), request({ columns: ["name", "roles"] })),
    ).toThrow(expect.objectContaining(denied));
    expect(() =>
      authorizeExport(adapter, actor(), request({ sort: [{ field: "roles", direction: "asc" }] })),
    ).toThrow(expect.objectContaining(denied));
  });
  it("keeps EXPORT_CONFIGURATION_INVALID (422) for unknown or malformed selections", () => {
    const patches: Partial<ExportRequest>[] = [
      { filters: { unknown: "x" } },
      { columns: ["missing"] },
      { filters: { search: ["a", "b"] } },
      { sort: [{ field: "missing", direction: "asc" as const }] },
    ];
    for (const patch of patches)
      expect(() => authorizeExport(adapter, actor(), request(patch))).toThrow(
        expect.objectContaining(invalid),
      );
  });
  it("still passes when the actor holds the permission", () => {
    const input = request({ columns: ["name", "roles"], filters: { secret: "x" } });
    expect(() => authorizeExport(adapter, actor("secret:read", "roles:read"), input)).not.toThrow();
  });
  it("keeps denying module and general permission failures with 403", () => {
    const noExport = { ...actor(), permissions: new Set(["users:read"]) };
    expect(() => authorizeExport(adapter, noExport, request())).toThrow(
      expect.objectContaining(denied),
    );
  });
});
