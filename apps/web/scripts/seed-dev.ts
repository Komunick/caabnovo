import { loadWorkspaceEnv } from "@caab/config/load-env";

loadWorkspaceEnv();
const { default: seedSyntheticData } = await import("../tests/e2e/global-setup");
await seedSyntheticData();
