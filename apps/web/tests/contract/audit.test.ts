import { describe, expect, it, vi } from "vitest";
import { auditExportRequestSchema, auditListQuerySchema, auditPageSchema } from "@caab/contracts";
import { createAuditEventsRoute } from "../../modules/audit/http/audit-events-route";
import { createAuditExportsRoute } from "../../modules/audit/http/audit-exports-route";

const reader = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(["audit:read", "audit:export"]),
  mfaVerified: true,
};

describe("audit contracts", () => {
  it("validates filters, pages and bounded export periods", () => {
    const from = new Date(Date.now() - 60_000).toISOString();
    const to = new Date().toISOString();
    expect(
      auditListQuerySchema.parse({
        actorId: crypto.randomUUID(),
        action: "user.updated",
        from,
        to,
      }),
    ).toMatchObject({ action: "user.updated", limit: 25 });
    expect(
      auditPageSchema.parse({
        items: [
          {
            id: crypto.randomUUID(),
            occurredAt: to,
            actorUserId: reader.userId,
            action: "user.updated",
            entityType: "user",
            entityId: crypto.randomUUID(),
            before: { status: "active" },
            after: { status: "disabled" },
            reason: "Validação sintética",
            origin: "web",
            requestId: crypto.randomUUID(),
            correlationId: crypto.randomUUID(),
          },
        ],
        nextCursor: null,
      }).items,
    ).toHaveLength(1);
    expect(
      auditExportRequestSchema.safeParse({ from: to, to: from, justification: "teste" }).success,
    ).toBe(false);
  });

  it("returns safe 401 and 403 responses for search and export", async () => {
    const search = createAuditEventsRoute({
      resolveActor: async () => null,
      search: vi.fn(),
    });
    const unauthenticated = await search.GET(
      new Request("https://caab.example.test/api/v1/audit-events"),
    );
    expect(unauthenticated.status).toBe(401);

    const exportRoute = createAuditExportsRoute({
      resolveActor: async () => ({ ...reader, permissions: new Set(["audit:read"]) }),
      create: vi.fn(),
    });
    const forbidden = await exportRoute.POST(
      new Request("https://caab.example.test/api/v1/audit-exports", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://caab.example.test",
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": "synthetic-export-0001",
        },
        body: JSON.stringify({
          from: new Date(Date.now() - 60_000).toISOString(),
          to: new Date().toISOString(),
          justification: "Investigação sintética",
        }),
      }),
    );
    expect(forbidden.status).toBe(403);
    expect(await forbidden.json()).toMatchObject({ message: "Permission denied" });
  });

  it("returns a contract-valid page and accepts an authorized export", async () => {
    const search = createAuditEventsRoute({
      resolveActor: async () => reader,
      search: async () => ({ items: [], nextCursor: null }),
    });
    expect(
      (
        await search.GET(
          new Request("https://caab.example.test/api/v1/audit-events?action=user.updated"),
        )
      ).status,
    ).toBe(200);

    const jobId = crypto.randomUUID();
    const exportRoute = createAuditExportsRoute({
      resolveActor: async () => reader,
      create: async () => ({ jobId, statusUrl: `/audit/exports/${jobId}` }),
    });
    const accepted = await exportRoute.POST(
      new Request("https://caab.example.test/api/v1/audit-exports", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://caab.example.test",
          "x-csrf-token": crypto.randomUUID(),
          "idempotency-key": "synthetic-export-0002",
        },
        body: JSON.stringify({
          from: new Date(Date.now() - 60_000).toISOString(),
          to: new Date().toISOString(),
          justification: "Investigação sintética",
        }),
      }),
    );
    expect(accepted.status).toBe(202);
    expect(await accepted.json()).toEqual({ jobId, statusUrl: `/audit/exports/${jobId}` });
  });
});
