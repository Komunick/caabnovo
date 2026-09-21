import { describe, expect, it } from "vitest";
import { exportRequestSchema, validateExportSelection } from "../src/exports";

const input = {
  module: "users",
  dataset: "users",
  filters: {},
  sort: [{ field: "name", direction: "asc" }],
  columns: ["name", "email"],
  format: "xlsx",
};
const catalog = {
  columns: [
    { key: "name", sortable: true },
    { key: "email", sortable: false },
  ],
  filters: [
    { key: "from", type: "date" as const },
    { key: "to", type: "date" as const },
  ],
};
describe("direct exports", () => {
  it.each(["xlsx", "csv", "pdf"])("accepts %s and preserves the ordered columns", (format) => {
    expect(
      exportRequestSchema.parse({ ...input, format, columns: ["email", "name"] }).columns,
    ).toEqual(["email", "name"]);
  });
  it("allows open and long periods without imposing record limits", () => {
    const request = exportRequestSchema.parse({
      ...input,
      filters: { from: "1900-01-01", to: "2200-12-31" },
    });
    expect(() => validateExportSelection(request, catalog)).not.toThrow();
    expect(() => validateExportSelection({ ...request, filters: {} }, catalog)).not.toThrow();
  });
  it.each([
    { columns: [] },
    { columns: ["name", "name"] },
    { module: "oab" },
    { format: "json" },
    { limit: 100 },
    { sql: "SELECT password" },
  ])("rejects malformed or unapproved configuration %j", (patch) => {
    expect(exportRequestSchema.safeParse({ ...input, ...patch }).success).toBe(false);
  });
  it.each([
    { columns: ["password"] },
    { filters: { token: "secret" } },
    { sort: [{ field: "email", direction: "asc" as const }] },
    { filters: { from: "2026-02-30" } },
    { filters: { from: "2026-10-01", to: "2026-01-01" } },
  ])("rejects an entire selection instead of dropping forbidden fields %j", (patch) => {
    expect(() =>
      validateExportSelection(exportRequestSchema.parse({ ...input, ...patch }), catalog),
    ).toThrow();
  });
});
