import { afterEach, describe, expect, it, vi } from "vitest";
import { validateMutationRequest } from "../users/http/responses";
import { validateMutation } from "../files/http/responses";
import { validateAuditMutation } from "../audit/http/responses";

const publicOrigin = "https://panel.example.test";
const internalOrigin = "http://0.0.0.0:3000";

function request(origin: string | null, headers: Record<string, string> = {}) {
  return new Request(`${internalOrigin}/api/v1/news`, {
    method: "POST",
    headers: {
      ...(origin === null ? {} : { origin }),
      "x-csrf-token": "s".repeat(32),
      "idempotency-key": crypto.randomUUID(),
      ...headers,
    },
  });
}

afterEach(() => vi.unstubAllEnvs());

describe.each([
  ["news and users", (input: Request) => validateMutationRequest(input, { idempotency: true })],
  ["news media", (input: Request) => validateMutation(input, true)],
  ["audit", validateAuditMutation],
] as const)("%s mutation origin behind a proxy", (_name, validate) => {
  it("accepts the configured public origin when the upstream URL is internal", () => {
    vi.stubEnv("BETTER_AUTH_URL", `${publicOrigin}/`);
    expect(() => validate(request(publicOrigin))).not.toThrow();
  });

  it.each([null, "null", "https://outside.test", internalOrigin, "http://panel.example.test"])(
    "rejects untrusted origin %s even with forged forwarding headers",
    (origin) => {
      vi.stubEnv("BETTER_AUTH_URL", publicOrigin);
      expect(() =>
        validate(request(origin, { host: "outside.test", "x-forwarded-host": "outside.test" })),
      ).toThrowError(expect.objectContaining({ status: 403, code: "ORIGIN_DENIED" }));
    },
  );

  it("still requires CSRF and idempotency headers on the public origin", () => {
    vi.stubEnv("BETTER_AUTH_URL", publicOrigin);
    expect(() => validate(request(publicOrigin, { "x-csrf-token": "" }))).toThrowError(
      expect.objectContaining({ status: 403, code: "CSRF_TOKEN_REQUIRED" }),
    );
    expect(() => validate(request(publicOrigin, { "idempotency-key": "" }))).toThrowError(
      expect.objectContaining({ status: 422, code: "IDEMPOTENCY_KEY_REQUIRED" }),
    );
  });

  it("keeps direct local development working without a configured public URL", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BETTER_AUTH_URL", undefined);
    expect(() => validate(request(internalOrigin))).not.toThrow();
    expect(() => validate(request(publicOrigin))).toThrowError(
      expect.objectContaining({ code: "ORIGIN_DENIED" }),
    );
  });

  it.each([undefined, "", "invalid-url"])(
    "fails closed in production when the public URL is %s",
    (url) => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("BETTER_AUTH_URL", url);
      expect(() => validate(request(internalOrigin))).toThrowError(
        expect.objectContaining({ status: 403, code: "ORIGIN_DENIED" }),
      );
    },
  );
});
