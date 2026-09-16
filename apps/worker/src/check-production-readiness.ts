import { readFileSync } from "node:fs";
import { requireProductionReadiness } from "./production-readiness";

try {
  const policy: unknown = JSON.parse(readFileSync("docs/privacy/retention-approval.json", "utf8"));
  requireProductionReadiness(
    {
      headRef: process.env.PROMOTION_HEAD_REF,
      baseRef: process.env.PROMOTION_BASE_REF,
      headRepository: process.env.PROMOTION_HEAD_REPOSITORY,
      baseRepository: process.env.PROMOTION_BASE_REPOSITORY,
    },
    policy,
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Production readiness could not be verified",
  );
  process.exitCode = 1;
}
