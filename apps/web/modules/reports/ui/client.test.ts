import { afterEach, expect, it, vi } from "vitest";
import { apiError } from "@caab/contracts";
import { reportRequest } from "./client";
afterEach(() => vi.unstubAllGlobals());
it("reads the shared API error contract and explains a saved-query conflict", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        Response.json(
          apiError(
            "REPORT_QUERY_CONFLICT",
            "Request conflicts with current state",
            crypto.randomUUID(),
          ),
          { status: 409 },
        ),
      ),
  );
  await expect(reportRequest("/queries")).rejects.toThrow(
    "Esta consulta mudou. Suas edições foram preservadas.",
  );
});
it("does not expose raw server messages on unexpected failures", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        Response.json(apiError("INTERNAL_ERROR", "private SQL details", crypto.randomUUID()), {
          status: 500,
        }),
      ),
  );
  await expect(reportRequest("/queries")).rejects.toThrow("Não foi possível concluir.");
});
