import { z } from "zod";

export function isLoopbackHostname(hostname: string): boolean {
  if (["localhost", "[::1]", "::1"].includes(hostname)) return true;
  const octets = hostname.split(".");
  return (
    octets.length === 4 &&
    octets[0] === "127" &&
    octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)
  );
}

// The panel routes live at the domain root. Paths, credentials and insecure public
// URLs would produce wrong recovery links, cookie settings or origin comparisons.
export const publicAppUrlSchema = z.url().refine((value) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    (url.protocol === "https:" || (url.protocol === "http:" && isLoopbackHostname(url.hostname))) &&
    url.pathname === "/" &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash
  );
}, "Use a public HTTPS origin without path, credentials, query or fragment; HTTP is local only");

export function isLocalAppURL(value: string | undefined): boolean {
  const parsed = publicAppUrlSchema.safeParse(value);
  return parsed.success && isLoopbackHostname(new URL(parsed.data).hostname);
}

export function isLocalTestMode(env: Record<string, string | undefined>): boolean {
  return env.E2E_TEST_MODE === "1" && isLocalAppURL(env.BETTER_AUTH_URL);
}
