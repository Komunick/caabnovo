import type { Pool } from "pg";
import { MAX_UPLOAD_SIZE_BYTES } from "@caab/contracts";
import {
  fileContentError,
  uploadMetadata,
  putQuarantineContent,
  readDatabaseContent,
} from "@caab/db/repositories/file-content";
import { verifyContentGrant } from "../content-grant";
import { requestId, routeError } from "./responses";

export async function readLimitedBody(request: Request, limit: number): Promise<Buffer> {
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit))
    throw fileContentError("PAYLOAD_TOO_LARGE", 413);
  const reader = request.body?.getReader();
  if (!reader) throw fileContentError("SIZE_MISMATCH");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw fileContentError("PAYLOAD_TOO_LARGE", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

export function createContentRoute(deps: { pool: () => Pool; secret: () => string }) {
  return async (request: Request) => {
    let response: Response;
    try {
      const key = verifyContentGrant(
        deps.secret(),
        new URL(request.url).searchParams.get("grant"),
        request.method,
      );
      const pool = deps.pool();
      if (request.method === "PUT") {
        const metadata = await uploadMetadata(pool, key);
        if (request.headers.get("content-type") !== metadata.declared_mime)
          throw fileContentError("CONTENT_TYPE_MISMATCH", 422);
        const body = await readLimitedBody(
          request,
          Math.min(Number(metadata.size_bytes), MAX_UPLOAD_SIZE_BYTES),
        );
        await putQuarantineContent(pool, key, body);
        response = new Response(null, { status: 204 });
      } else {
        const file = await readDatabaseContent(pool, key);
        const inline = ["image/png", "image/jpeg"].includes(file.mime);
        response = new Response(new Uint8Array(file.body), {
          headers: {
            "content-type": file.mime,
            "content-length": String(file.body.length),
            "content-disposition": inline
              ? "inline"
              : `attachment; filename*=UTF-8''${encodeURIComponent(file.original_name)}`,
            "content-security-policy": "default-src 'none'; sandbox",
            "access-control-allow-origin": "*",
          },
        });
      }
    } catch (error) {
      response = routeError(error, requestId(request));
    }
    response.headers.set("cache-control", "no-store");
    response.headers.set("x-content-type-options", "nosniff");
    response.headers.set("referrer-policy", "no-referrer");
    return response;
  };
}
