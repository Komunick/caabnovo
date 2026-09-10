import { describe, expect, it, vi } from "vitest";
import { createDatabaseClient } from "./client";

describe("idle database connection failures", () => {
  it("reports the failure without an uncaught error or raw connection details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = createDatabaseClient("postgresql://synthetic:synthetic@localhost:1/test");
    try {
      expect(() =>
        client.pool.emit("error", new Error("connection with secret and SQL")),
      ).not.toThrow();
      expect(log).toHaveBeenCalledOnce();
      expect(log.mock.calls[0]?.[0]).toContain("DATABASE_CONNECTION_ERROR");
      expect(log.mock.calls[0]?.[0]).not.toContain("secret");
    } finally {
      await client.close();
      log.mockRestore();
    }
  });
});
