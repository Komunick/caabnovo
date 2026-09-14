import { createHmac, timingSafeEqual } from "node:crypto";
import { fileContentError } from "@caab/db/repositories/file-content";

const TTL_SECONDS = 300;
export function signContentGrant(
  secret: string,
  origin: string,
  key: string,
  method: "GET" | "PUT",
) {
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);
  const payload = Buffer.from(
    JSON.stringify({ key, method, expires: Math.floor(expiresAt.getTime() / 1000) }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`file-content:${payload}`)
    .digest("base64url");
  const url = new URL("/api/v1/files/content", origin);
  url.searchParams.set("grant", `${payload}.${signature}`);
  return { url: url.toString(), expiresAt };
}

export function verifyContentGrant(secret: string, token: string | null, method: string): string {
  try {
    if (!token || token.length > 2048) throw new Error();
    const parts = token.split(".");
    if (parts.length !== 2) throw new Error();
    const [payload, signature] = parts as [string, string];
    const expected = createHmac("sha256", secret).update(`file-content:${payload}`).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied))
      throw new Error();
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (
      data.method !== method ||
      !Number.isInteger(data.expires) ||
      data.expires <= now ||
      data.expires > now + TTL_SECONDS ||
      typeof data.key !== "string" ||
      !/^database\/(quarantine|private|audit-exports)\/[a-zA-Z0-9.-]+$/.test(data.key) ||
      (method === "GET" && data.key.startsWith("database/quarantine/")) ||
      (method === "PUT" && !data.key.startsWith("database/quarantine/"))
    )
      throw new Error();
    return data.key;
  } catch {
    throw fileContentError("INVALID_FILE_GRANT", 403);
  }
}
