import { describe, expect, it } from "vitest";
import { exportRequestSchema, type ExportRequest } from "@caab/contracts";
import { authorizeExport, authorizedCatalog } from "../exports/catalog";
import { lookupExport } from "../exports/runtime";
import { schedulingExports } from "./export-adapter";
import { schedulingExportFixtures } from "./export-fixtures";

const actor = (permissions: string[]) => ({
  userId: "synthetic",
  sessionId: "synthetic",
  permissions: new Set(permissions),
});
describe.each(["bookings", "catalog", "hours", "absences"])("scheduling export %s", (dataset) => {
  const adapter = () => schedulingExports.find((item) => item.dataset === dataset)!;
  const input = () =>
    exportRequestSchema.parse({ module: "scheduling", dataset, columns: ["id"], format: "csv" });
  it.each(
    [[], ["scheduling:read"], ["exports:generate"], ["scheduling:write", "exports:generate"]].map(
      (permissions) => ({ permissions }),
    ),
  )("denies incomplete grants $permissions", ({ permissions }) => {
    expect(() => authorizeExport(adapter(), actor(permissions), input())).toThrow(
      "PERMISSION_DENIED",
    );
  });
  it("allows read plus general export without write and preserves the users registry", () => {
    expect(
      authorizedCatalog(adapter(), actor(["scheduling:read", "exports:generate"])).dataset,
    ).toBe(dataset);
    expect(lookupExport("scheduling", dataset)).toBe(adapter());
    expect(lookupExport("users", "accounts").module).toBe("users");
  });
  it("rejects forbidden columns, filters, sort fields and malformed identifiers", () => {
    const reader = actor(["scheduling:read", "exports:generate"]);
    const changes: Partial<ExportRequest>[] = [
      { columns: ["cpf"] },
      { filters: { cpf: "RESTRITO" } },
      { sort: [{ field: "created_by", direction: "asc" as const }] },
      { filters: { unitId: "not-a-uuid" } },
    ];
    for (const change of changes)
      expect(() => authorizeExport(adapter(), reader, { ...input(), ...change })).toThrow(
        "EXPORT_CONFIGURATION_INVALID",
      );
  });
  it("builds only allowlisted ordered columns without a calendar/page limit", () => {
    const keys = adapter()
      .columns.slice(0, 3)
      .map((item) => item.key)
      .reverse();
    const query = adapter().query({
      ...input(),
      columns: keys,
      sort: [{ field: keys[0]!, direction: "desc" }],
    });
    expect(query.text).not.toMatch(/\bLIMIT\b|\bOFFSET\b/i);
    for (const key of keys) expect(query.text).toContain(`AS "${key}"`);
    expect(query.text).toContain("DESC");
    expect(query.text).toContain('d."id" ASC');
  });
});
it("accepts a full year, parameterizes literal search and keeps a stable date/id order", () => {
  const adapter = schedulingExports[0]!;
  const input = exportRequestSchema.parse({
    module: "scheduling",
    dataset: "bookings",
    columns: ["memberName", "id"],
    format: "csv",
    filters: { from: "2030-01-01", to: "2030-12-31", q: "%_" },
  });
  const query = adapter.query(input);
  expect(query.values).toContain("%\\%\\_%");
  expect(query.text).not.toContain("%_");
  expect(query.text.indexOf('AS "memberName"')).toBeLessThan(query.text.lastIndexOf('AS "id"'));
  const mapped = adapter.map({
    _recordId: schedulingExportFixtures[0]!.id,
    id: schedulingExportFixtures[0]!.id,
    memberName: schedulingExportFixtures[0]!.memberName,
  });
  expect(mapped.values).not.toHaveProperty("forbiddenCpf");
  expect(schedulingExportFixtures).toHaveLength(100);
});
it("exports absence metadata with the list status semantics and excludes private review content", () => {
  const adapter = lookupExport("scheduling", "absences");
  const input = exportRequestSchema.parse({
    module: "scheduling",
    dataset: "absences",
    columns: ["memberName", "status", "recordedAt"],
    format: "csv",
    filters: { q: "  %_  ", status: "under_review", from: "2030-01-01", to: "2030-12-31" },
  });
  const query = adapter.query(input);
  expect(query.values).toContain("%\\%\\_%");
  expect(query.values).toContain("under_review");
  expect(query.text).toContain('d."recordedAt">=');
  expect(query.text).toContain('d."recordedAt" DESC');
  expect(query.text).toContain('d."id" DESC');
  expect(query.text).toContain("WHEN p.submitted_at IS NOT NULL THEN 'under_review'");
  expect(query.text).not.toMatch(/\bLIMIT\b|\bOFFSET\b|explanation|file_id|email/);
  for (const key of ["explanation", "evidenceFileIds", "email", "object_key", "cpf"])
    expect(() => adapter.query({ ...input, columns: [key] })).toThrow(
      "EXPORT_CONFIGURATION_INVALID",
    );
  expect(() => adapter.query({ ...input, filters: { q: "a".repeat(101) } })).toThrow(
    "EXPORT_CONFIGURATION_INVALID",
  );
  expect(
    adapter.map({
      _recordId: "synthetic",
      memberName: "Pessoa",
      explanation: "RESTRITO",
      email: "nao@example.test",
    }).values,
  ).toEqual({ memberName: "Pessoa" });
});
