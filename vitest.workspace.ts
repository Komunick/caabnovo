import { resolve } from "node:path";

const resolveConfig = {
  alias: {
    "server-only": resolve("apps/web/node_modules/server-only/empty.js"),
  },
};

export default [
  {
    resolve: resolveConfig,
    test: {
      name: "unit",
      include: ["apps/**/*.test.{ts,tsx}", "packages/**/src/**/*.test.ts"],
      exclude: ["**/node_modules/**", "**/*.integration.test.ts", "apps/web/tests/**"],
      environment: "node",
    },
  },
  {
    resolve: resolveConfig,
    test: {
      name: "integration",
      include: [
        "packages/db/tests/**/*.test.ts",
        "apps/**/tests/integration/**/*.test.ts",
        "apps/worker/tests/**/*.integration.test.ts",
      ],
      exclude: ["**/node_modules/**"],
      environment: "node",
      hookTimeout: 120_000,
      testTimeout: 60_000,
    },
  },
  {
    resolve: resolveConfig,
    test: {
      name: "contract",
      include: ["packages/contracts/tests/**/*.test.ts", "apps/web/tests/contract/**/*.test.ts"],
      exclude: ["**/node_modules/**"],
      environment: "node",
    },
  },
];
