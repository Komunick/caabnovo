import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { normalizeOpenApi, validateOpenApi } from "../src/openapi.js";

const contractPath = resolve(
  import.meta.dirname,
  "../../../specs/001-project-foundation/contracts/openapi.yaml",
);
const source = await readFile(contractPath, "utf8");
const normalized = normalizeOpenApi(source);
const errors = validateOpenApi(normalized);

if (errors.length) throw new Error(`Invalid OpenAPI contract:\n- ${errors.join("\n- ")}`);
await writeFile(contractPath, normalized, "utf8");
console.log(`Generated ${contractPath}`);
