import { describe, expect, it } from "vitest";
import { assertLocalSeedTarget } from "../../tests/support/local-seed-target";
const local = {
  BETTER_AUTH_URL: "http://localhost:3000",
  DATABASE_ADMIN_URL: "postgresql://test:test@127.0.0.1:5432/test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
};
describe("synthetic seed boundary", () => {
  it("permits explicit loopback targets and rejects production or remote destinations before connection", () => {
    expect(() => assertLocalSeedTarget(local)).not.toThrow();
    for (const env of [
      { ...local, NODE_ENV: "production" },
      { ...local, BETTER_AUTH_URL: "https://panel.example.test" },
      { ...local, DATABASE_ADMIN_URL: "postgresql://test:test@database.example.test/test" },
      { ...local, DATABASE_URL: "postgresql://test:test@localhost/test?host=remote.example.test" },
      { ...local, DATABASE_ADMIN_URL: undefined },
    ])
      expect(() => assertLocalSeedTarget(env)).toThrow();
  });
});
