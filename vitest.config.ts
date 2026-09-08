import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import projects from "./vitest.workspace.ts";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": resolve("apps/web/node_modules/server-only/empty.js"),
    },
  },
  test: { projects },
});
