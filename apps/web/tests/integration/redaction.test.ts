import { describe, expect, it } from "vitest";
import { allowlistedLogFields, redactSensitive } from "@caab/config/redaction";
import { routeError } from "../../modules/files/http/responses";

const canaries = {
  password: "Synthetic-Password-Canary!",
  token: "synthetic-token-canary",
  cookie: "caab.session=synthetic-cookie-canary",
  email: "person-canary@example.test",
  name: "Pessoa Canário Sintética",
};

function expectNoCanary(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const canary of Object.values(canaries)) expect(serialized).not.toContain(canary);
  expect(serialized).not.toContain("internal-service.ts:42");
}

describe("web redaction canaries", () => {
  it("redacts nested secrets and unnecessary personal data before persistence", () => {
    const redacted = redactSensitive({
      ...canaries,
      nested: { authorization: `Bearer ${canaries.token}`, profile: { email: canaries.email } },
      safe: "allowed-value",
    });
    expect(redacted).toMatchObject({
      password: "[REDACTED]",
      token: "[REDACTED]",
      cookie: "[REDACTED]",
      email: "[REDACTED]",
      name: "[REDACTED]",
      safe: "allowed-value",
    });
    expectNoCanary(redacted);
  });

  it("drops raw stack, payload and PII from structured logs", () => {
    const fields = allowlistedLogFields({
      event: "synthetic.failure",
      outcome: "failure",
      requestId: crypto.randomUUID(),
      stack: `Error at internal-service.ts:42 ${canaries.password}`,
      payload: canaries,
      email: canaries.email,
    });
    expect(fields).toMatchObject({ event: "synthetic.failure", outcome: "failure" });
    expect(fields).not.toHaveProperty("stack");
    expect(fields).not.toHaveProperty("payload");
    expectNoCanary(fields);
  });

  it("maps arbitrary exceptions to an allowlisted HTTP response", async () => {
    const response = routeError(
      new Error(`password=${canaries.password} at internal-service.ts:42`),
      crypto.randomUUID(),
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toMatchObject({ code: "INTERNAL_ERROR", message: "Unexpected server error" });
    expectNoCanary(body);
  });
});
