import { describe, expect, it } from "vitest";
import { requireProductionReadiness, requirePromotionSource } from "../src/production-readiness";
import { applyRetention } from "../src/jobs/apply-retention";

const source = {
  headRef: "dev",
  baseRef: "main",
  headRepository: "Example/project",
  baseRepository: "Example/project",
};
const syntheticApproval = {
  status: "APPROVED",
  approvedBy: "Synthetic test reviewer",
  approvedAt: "2026-09-16T12:00:00Z",
  policyVersion: "test-only",
  categories: [{ code: "synthetic", retentionDays: 1, action: "delete" }],
};

describe("production promotion", () => {
  it("accepts only the same repository dev source into main", () => {
    expect(() => requirePromotionSource(source)).not.toThrow();
  });
  it.each([
    { ...source, headRef: "fix/change" },
    { ...source, headRepository: "Fork/project" },
    { ...source, baseRef: "dev" },
    { ...source, headRepository: undefined },
    { ...source, baseRepository: undefined },
  ])("rejects a different or missing source before privacy evaluation", (candidate) => {
    expect(() => requireProductionReadiness(candidate, syntheticApproval)).toThrow("requires dev");
  });
  it.each([
    undefined,
    "Status: APPROVED",
    { status: "APPROVED" },
    { ...syntheticApproval, categories: [] },
    { ...syntheticApproval, approvedAt: "invalid" },
  ])("rejects incomplete or textual approval", (policy) => {
    expect(() => requireProductionReadiness(source, policy)).toThrow("not approved");
  });
  it("blocks promotion even with a structurally valid approval while disposal is unimplemented", () => {
    expect(() => requireProductionReadiness(source, syntheticApproval)).toThrow(
      "not been implemented",
    );
  });
  it("keeps the same implementation gate in the runtime", async () => {
    await expect(applyRetention(syntheticApproval)).rejects.toThrow("not been implemented");
  });
});
