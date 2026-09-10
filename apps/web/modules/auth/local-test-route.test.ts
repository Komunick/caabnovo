import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), query: vi.fn() }));
vi.mock("./auth", () => ({ getAuth: () => ({ api: { getSession: mocks.getSession } }) }));
vi.mock("../shared/database", () => ({ getDatabase: () => ({ pool: { query: mocks.query } }) }));
vi.mock("@caab/config", async (original) => ({
  ...(await original<object>()),
  loadWorkspaceEnv: () => undefined,
}));
import { POST } from "../../app/api/test/revoke-current-session/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("local test session revocation", () => {
  it("is unavailable on a public site even if the test flag was copied", async () => {
    vi.stubEnv("E2E_TEST_MODE", "1");
    vi.stubEnv("BETTER_AUTH_URL", "https://panel.example.test");
    expect(
      (
        await POST(
          new Request("http://localhost:3000/api/test/revoke-current-session", { method: "POST" }),
        )
      ).status,
    ).toBe(404);
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("requires the local origin before looking up a session", async () => {
    vi.stubEnv("E2E_TEST_MODE", "1");
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
    expect(
      (
        await POST(
          new Request("http://localhost:3000/api/test/revoke-current-session", {
            method: "POST",
            headers: { origin: "https://outside.test" },
          }),
        )
      ).status,
    ).toBe(403);
    expect(mocks.getSession).not.toHaveBeenCalled();
  });
});
