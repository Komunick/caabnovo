import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { pageContentSecurityPolicy } from "./modules/shared/security-headers";

export function proxy(request: NextRequest) {
  const nonce = randomBytes(18).toString("base64");
  const secure = (process.env.BETTER_AUTH_URL ?? request.url).startsWith("https:");
  const csp = pageContentSecurityPolicy(nonce, process.env.NODE_ENV === "development", secure);
  const headers = new Headers(request.headers);
  // Never trust a nonce/CSP supplied by the client.
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  if (secure) response.headers.set("Strict-Transport-Security", "max-age=31536000");
  return response;
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/).*)",
  ],
};
