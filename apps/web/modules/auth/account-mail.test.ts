import { describe, expect, it } from "vitest";
import { accountMailConfig } from "./account-mail";

describe("mail environment boundary", () => {
  it("never silently falls back to localhost when the application URL is missing", () => {
    expect(() => accountMailConfig({ MAIL_MODE: "local" })).toThrow();
  });
  it.each(["", "0", "65536", "abc", "25.5"])("rejects invalid SMTP port %s", (port) => {
    expect(() =>
      accountMailConfig({
        MAIL_MODE: "local",
        BETTER_AUTH_URL: "http://localhost:3000",
        SMTP_PORT: port,
      }),
    ).toThrow();
  });
  it("uses implicit TLS for the normalized port 465", () => {
    expect(
      accountMailConfig({
        MAIL_MODE: "smtp",
        BETTER_AUTH_URL: "https://panel.example.test",
        SMTP_HOST: "smtp.example.test",
        SMTP_PORT: "0465",
        SMTP_USER: "synthetic",
        SMTP_PASSWORD: "synthetic",
        MAIL_FROM: "test@example.test",
      }).secure,
    ).toBe(true);
  });
  it("restricts the local mailbox to loopback addresses", () => {
    expect(
      accountMailConfig({ MAIL_MODE: "local", BETTER_AUTH_URL: "http://localhost:3105" }).local,
    ).toBe(true);
    expect(
      accountMailConfig({
        MAIL_MODE: "local",
        BETTER_AUTH_URL: "http://[::1]:3105",
        SMTP_HOST: "::1",
      }).local,
    ).toBe(true);
    expect(() =>
      accountMailConfig({
        MAIL_MODE: "local",
        BETTER_AUTH_URL: "http://localhost:3105",
        SMTP_HOST: "127.attacker.test",
      }),
    ).toThrow();
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
