import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeOpenApi, validateOpenApi } from "../src/openapi.js";

describe("CAAB OpenAPI contract", () => {
  it.each(["001-project-foundation", "004-news-publishing"])(
    "%s is valid, versioned and deterministic",
    async (feature) => {
      const source = await readFile(
        resolve(process.cwd(), `specs/${feature}/contracts/openapi.yaml`),
        "utf8",
      );
      const first = normalizeOpenApi(source);
      const second = normalizeOpenApi(first);

      expect(validateOpenApi(first)).toEqual([]);
      expect(second).toBe(first);
    },
  );

  it("rejects an unversioned public server", () => {
    const invalid =
      "openapi: 3.1.1\ninfo: { title: Invalid, version: 1.0.0 }\nservers: [{ url: /api }]\npaths: {}\n";
    expect(validateOpenApi(invalid)).toContain("Every server URL must include /api/v1");
  });
});
