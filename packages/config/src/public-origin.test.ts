import { describe, expect, it } from "vitest";
import { publicAppUrlSchema, isLocalAppURL, isLocalTestMode } from "./public-origin";

describe("public application origin", () => {
  it.each([
    "https://panel.example.test",
    "https://panel.example.test:8443/",
    "http://localhost:3100",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ])("accepts %s", (url) => {
    expect(publicAppUrlSchema.safeParse(url).success).toBe(true);
  });
  it.each([
    undefined,
    "",
    "invalid",
    "http://panel.example.test",
    "https://panel.example.test/admin",
    "https://panel.example.test?query=1",
    "https://panel.example.test#hash",
    "https://user:secret@panel.example.test",
    "file:///tmp/panel",
  ])("rejects invalid base URL %s", (url) => {
    expect(publicAppUrlSchema.safeParse(url).success).toBe(false);
  });
  it("does not enable local helpers on public or missing URLs", () => {
    for (const url of [
      undefined,
      "https://panel.example.test",
      "http://localhost.attacker.test",
      "https://127.attacker.test",
      "http://127.0.0.1.attacker.test",
      "invalid",
    ]) {
      expect(isLocalAppURL(url)).toBe(false);
      expect(isLocalTestMode({ E2E_TEST_MODE: "1", BETTER_AUTH_URL: url })).toBe(false);
    }
    expect(isLocalTestMode({ E2E_TEST_MODE: "1", BETTER_AUTH_URL: "http://localhost:3000" })).toBe(
      true,
    );
    expect(isLocalTestMode({ BETTER_AUTH_URL: "http://localhost:3000" })).toBe(false);
  });
});
