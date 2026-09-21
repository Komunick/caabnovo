import { expect, it } from "vitest";
import { usersExport } from "./export-adapter";
import { authorizeExport } from "../exports/catalog";
import type { ExportRequest } from "@caab/contracts";
const input: ExportRequest = {
  module: "users",
  dataset: "accounts",
  format: "csv",
  filters: { name: "' OR true --" },
  sort: [{ field: "name", direction: "desc" }],
  columns: ["name", "email"],
};
it("parameterizes filters, applies stable ordering and never selects secrets", () => {
  const q = usersExport.query(input);
  expect(q.text).not.toContain("' OR true --");
  expect(q.values).toContain("%' OR true --%");
  expect(q.text).toContain("u.name DESC, u.id ASC");
  expect(q.text).not.toMatch(/password|token|session|SELECT\s+\*/i);
  expect(q.text).not.toContain("user_role");
});
it("requires source and general permissions, and role consultation for role/access fields", () => {
  const actor = {
    userId: "synthetic",
    sessionId: "synthetic",
    permissions: new Set(["exports:generate", "users:read"]),
  };
  expect(() => authorizeExport(usersExport, actor, input)).not.toThrow();
  expect(() => authorizeExport(usersExport, actor, { ...input, columns: ["roles"] })).toThrow();
  expect(() =>
    authorizeExport(usersExport, { ...actor, permissions: new Set(["exports:generate"]) }, input),
  ).toThrow();
});
