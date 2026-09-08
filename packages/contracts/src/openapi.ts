import { parse, stringify } from "yaml";

interface OpenApiDocument {
  openapi?: unknown;
  info?: { title?: unknown; version?: unknown };
  servers?: Array<{ url?: unknown }>;
  paths?: Record<string, unknown>;
  components?: unknown;
}

export function normalizeOpenApi(source: string): string {
  const document = parse(source) as OpenApiDocument;
  return stringify(document, {
    aliasDuplicateObjects: false,
    lineWidth: 0,
    sortMapEntries: false,
  });
}

export function validateOpenApi(source: string): string[] {
  let document: OpenApiDocument;
  try {
    document = parse(source) as OpenApiDocument;
  } catch {
    return ["Contract must be valid YAML"];
  }

  const errors: string[] = [];
  if (document.openapi !== "3.1.1") errors.push("OpenAPI version must be 3.1.1");
  if (typeof document.info?.title !== "string" || typeof document.info.version !== "string") {
    errors.push("Contract info title and version are required");
  }
  if (!document.paths || typeof document.paths !== "object")
    errors.push("Contract paths are required");
  if (!document.components || typeof document.components !== "object")
    errors.push("Contract components are required");
  if (
    !document.servers?.length ||
    document.servers.some(({ url }) => typeof url !== "string" || !url.includes("/api/v1"))
  ) {
    errors.push("Every server URL must include /api/v1");
  }
  return errors;
}
