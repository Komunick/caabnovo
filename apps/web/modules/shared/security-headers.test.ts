import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../../proxy";

describe("page CSP", () => {
  it("overrides attacker-supplied policy/nonce, creates a fresh nonce and disables caching", () => {
    const request = new NextRequest("https://panel.example.test/login", {
      headers: { "x-nonce": "attacker", "content-security-policy": "script-src * 'unsafe-inline'" },
    });
    const first = proxy(request),
      second = proxy(request);
    const csp = first.headers.get("content-security-policy")!;
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://viacep.com.br");
    expect(csp.split(";").find((part) => part.trim().startsWith("script-src"))).not.toMatch(
      /unsafe-inline|unsafe-eval|attacker/,
    );
    expect(csp).not.toBe(second.headers.get("content-security-policy"));
    const nonce = /'nonce-([^']+)'/.exec(csp)![1];
    expect(first.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
    expect(first.headers.get("cache-control")).toBe("private, no-store");
  });
});
