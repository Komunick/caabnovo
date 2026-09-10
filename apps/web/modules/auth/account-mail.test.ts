import { describe, expect, it } from "vitest";
import { accountMailConfig } from "./account-mail";

describe("mail environment boundary", () => {
  it("restricts the local mailbox to loopback addresses", () => {
    expect(
      accountMailConfig({ MAIL_MODE: "local", BETTER_AUTH_URL: "http://localhost:3105" }).local,
    ).toBe(true);
    expect(() =>
      accountMailConfig({ MAIL_MODE: "local", BETTER_AUTH_URL: "https://portal.example.test" }),
    ).toThrow();
    expect(() =>
      accountMailConfig({ MAIL_MODE: "local", SMTP_HOST: "smtp.example.test" }),
    ).toThrow();
  });
  it("requires real delivery settings and HTTPS outside localhost", () => {
    expect(() => accountMailConfig({})).toThrow();
    const config = accountMailConfig({
      MAIL_MODE: "smtp",
      BETTER_AUTH_URL: "https://portal.example.test",
      SMTP_HOST: "smtp.example.test",
      SMTP_USER: "synthetic",
      SMTP_PASSWORD: "synthetic",
      MAIL_FROM: "caab@example.test",
    });
    expect(config.requireTLS).toBe(true);
    expect(config.local).toBe(false);
    expect(() =>
      accountMailConfig({ MAIL_MODE: "smtp", BETTER_AUTH_URL: "http://portal.example.test" }),
    ).toThrow();
  });
});
