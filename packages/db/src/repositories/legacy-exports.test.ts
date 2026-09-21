import { describe, expect, it } from "vitest";
import { reportExportSchema } from "@caab/contracts";
import {
  authorizeStoredExport,
  storedReportRequirements,
  type StoredReportExport,
} from "./report-storage";

describe("legacy report authorization", () => {
  const stored = (
    view: "details" | "summary" | "executive",
    dataset = "bookings",
  ): StoredReportExport => ({
    input: reportExportSchema.parse({
      format: "csv",
      query: { view, dataset, from: "2026-01-01", to: "2026-09-21" },
    }),
    permissions: ["reports:read", "reports:export"],
  });
  it.each(["details", "summary", "executive"] as const)(
    "requires current scheduling access for the unversioned %s generator",
    (view) => {
      const actor = { userId: "owner", permissions: new Set(["reports:read", "exports:generate"]) };
      const configuration = stored(view);
      const original = JSON.stringify(configuration);
      expect(() => authorizeStoredExport(actor, configuration)).toThrow("PERMISSION_DENIED");
      actor.permissions.add("scheduling:read");
      expect(() => authorizeStoredExport(actor, configuration)).not.toThrow();
      expect(JSON.stringify(configuration)).toBe(original);
    },
  );
  it("never treats old names in the current grants as an export permission", () => {
    expect(() =>
      authorizeStoredExport(
        {
          userId: "owner",
          permissions: new Set(["reports:read", "reports:export", "scheduling:read"]),
        },
        stored("details"),
      ),
    ).toThrow();
  });
  it("keeps all recorded domain requirements and rejects indeterminate generators", () => {
    const configuration = stored("summary");
    configuration.permissions.push("members:read");
    expect(storedReportRequirements(configuration)).toContain("members:read");
    expect(() => storedReportRequirements({ ...configuration, generatorVersion: 999 })).toThrow(
      "REPORT_SOURCE_UNKNOWN",
    );
    expect(() => storedReportRequirements({ ...configuration, input: {} as never })).toThrow(
      "REPORT_SOURCE_UNKNOWN",
    );
  });
  it("uses the explicit sources of the new generator without adding unrelated sources", () => {
    const configuration = { ...stored("summary"), generatorVersion: 2 };
    expect(storedReportRequirements(configuration)).toEqual(["reports:read", "exports:generate"]);
  });
});
