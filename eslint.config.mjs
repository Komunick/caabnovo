import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { boundaryRestrictions } from "./packages/config/eslint/boundaries.mjs";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: boundaryRestrictions,
        },
      ],
    },
  },
);
