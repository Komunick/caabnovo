import { describe, expect, it } from "vitest";
import { getWorkspaceAreas, isAreaActive } from "./areas";

describe("consolidated workspace navigation", () => {
  it("only shows Parceiros with explicit read permission", () => {
    expect(
      getWorkspaceAreas(["partners:write", "partners:publish"]).some(
        (area) => area.id === "partners",
      ),
    ).toBe(false);
    const area = getWorkspaceAreas(["partners:read"]).find((area) => area.id === "partners");
    expect(area?.href).toBe("/partners");
    expect(isAreaActive(area!, "/partners/benefits")).toBe(true);
  });
  it("requires read access for private news navigation", () => {
    expect(getWorkspaceAreas([]).some((area) => area.id === "news")).toBe(false);
    expect(getWorkspaceAreas(["news:read"]).some((area) => area.id === "news")).toBe(true);
  });
  it("only shows Associados with explicit read permission", () => {
    expect(
      getWorkspaceAreas(["members:write", "members:review"]).some((a) => a.id === "members"),
    ).toBe(false);
    expect(getWorkspaceAreas(["members:read"]).filter((a) => a.id === "members")).toHaveLength(1);
  });
  it.each([
    [[], undefined],
    [["audit:read"], "/audit"],
    [["jobs:read"], "/audit/jobs"],
    [["audit:read", "jobs:read"], "/audit"],
  ])("selects an authorized destination for %j", (permissions, destination) => {
    const areas = getWorkspaceAreas(permissions);
    const audit = areas.filter(({ id }) => id === "audit");
    expect(audit).toHaveLength(destination ? 1 : 0);
    expect(audit[0]?.href).toBe(destination);
    expect(areas.some(({ label }) => label === "Operações")).toBe(false);
  });

  it("does not treat export or redrive permission as permission to read the area", () => {
    expect(getWorkspaceAreas(["audit:export", "jobs:redrive"]).map(({ id }) => id)).toEqual([
      "home",
      "sessions",
      "settings",
    ]);
  });

  it("keeps legacy operation paths in the same area without matching unrelated prefixes", () => {
    const area = getWorkspaceAreas(["jobs:read"]).find(({ id }) => id === "audit")!;
    expect(isAreaActive(area, "/audit/jobs/123")).toBe(true);
    expect(isAreaActive(area, "/operations/jobs/123")).toBe(true);
    expect(isAreaActive(area, "/auditorium")).toBe(false);
    expect(area.keywords).toContain("operações");
  });
});
