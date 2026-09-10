import "server-only";
import { publicAppUrlSchema } from "@caab/config";

export function hasTrustedMutationOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;

  // Reverse proxies can give Next.js an internal host/port. Use the same trusted
  // public URL as authentication, never client-supplied Host/Forwarded headers.
  const publicURL = process.env.BETTER_AUTH_URL;
  if (publicURL === undefined && process.env.NODE_ENV === "production") return false;
  if (publicURL !== undefined && !publicAppUrlSchema.safeParse(publicURL).success) return false;

  try {
    const expected = new URL(publicURL ?? request.url);
    return (
      (expected.protocol === "https:" || expected.protocol === "http:") &&
      origin === expected.origin
    );
  } catch {
    return false;
  }
}
