import {
  requireApprovedRetentionPolicy,
  requireImplementedRetentionControls,
} from "./jobs/apply-retention";

export type PromotionSource = {
  headRef?: string;
  baseRef?: string;
  headRepository?: string;
  baseRepository?: string;
};

export function requirePromotionSource(source: PromotionSource): void {
  if (
    source.headRef !== "dev" ||
    source.baseRef !== "main" ||
    !source.baseRepository ||
    source.headRepository !== source.baseRepository
  ) {
    throw new Error("Production promotion requires dev from the same repository into main");
  }
}

export function requireProductionReadiness(source: PromotionSource, policy: unknown): never {
  requirePromotionSource(source);
  requireApprovedRetentionPolicy(policy);
  return requireImplementedRetentionControls();
}
