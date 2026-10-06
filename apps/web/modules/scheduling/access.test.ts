import type { Pool, PoolClient } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { withTransaction } from "@caab/db";
import { readUserPermissions } from "@caab/db/repositories/user-access";
import { lockMemberEligibility } from "@caab/db/repositories/members";
import { schedulingAccess } from "./access";

vi.mock("@caab/db", () => ({ withTransaction: vi.fn() }));
vi.mock("@caab/db/repositories/user-access", () => ({ readUserPermissions: vi.fn() }));
vi.mock("@caab/db/repositories/members", () => ({ lockMemberEligibility: vi.fn() }));

const pool = {} as Pool;
const query = vi.fn();
const client = { query } as unknown as PoolClient;
const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  // This stale caller snapshot must never grant server-side access.
  permissions: new Set(["scheduling:read", "scheduling:write"]),
};
const operation = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(withTransaction).mockImplementation(async (_pool, work) => work(client));
  query.mockResolvedValue({ rowCount: 1, rows: [{ id: actor.userId }] });
  vi.mocked(readUserPermissions).mockResolvedValue(["scheduling:read", "scheduling:write"]);
  vi.mocked(lockMemberEligibility).mockResolvedValue(undefined);
  operation.mockResolvedValue("authorized result");
});

describe("scheduling authorization around the eligibility lock", () => {
  it.each([
    { grants: [], write: false, allowed: false },
    { grants: [], write: true, allowed: false },
    { grants: ["scheduling:read"], write: false, allowed: true },
    { grants: ["scheduling:read"], write: true, allowed: false },
    { grants: ["scheduling:write"], write: false, allowed: false },
    { grants: ["scheduling:write"], write: true, allowed: false },
    { grants: ["scheduling:read", "scheduling:write"], write: false, allowed: true },
    { grants: ["scheduling:read", "scheduling:write"], write: true, allowed: true },
  ])("uses database grants $grants for write=$write", async ({ grants, write, allowed }) => {
    vi.mocked(readUserPermissions).mockResolvedValue(grants);
    const result = schedulingAccess(pool, actor, write, operation);
    if (allowed) {
      await expect(result).resolves.toBe("authorized result");
      expect(operation).toHaveBeenCalledWith(client);
      expect(lockMemberEligibility).toHaveBeenCalledTimes(write ? 1 : 0);
    } else {
      await expect(result).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
      expect(operation).not.toHaveBeenCalled();
      expect(lockMemberEligibility).not.toHaveBeenCalled();
    }
  });

  it("checks grants before entering the shared write lock and again before the effect", async () => {
    vi.mocked(lockMemberEligibility).mockImplementation(async () => {
      expect(readUserPermissions).toHaveBeenCalledTimes(1);
      expect(operation).not.toHaveBeenCalled();
    });
    operation.mockImplementation(async () => {
      expect(readUserPermissions).toHaveBeenCalledTimes(2);
      return "authorized result";
    });
    await expect(schedulingAccess(pool, actor, true, operation)).resolves.toBe("authorized result");
  });

  it.each([[], ["scheduling:read"], ["scheduling:write"]])(
    "rejects grants revoked while waiting: %j",
    async (...grants: string[]) => {
      vi.mocked(lockMemberEligibility).mockImplementation(async () => {
        vi.mocked(readUserPermissions).mockResolvedValue(grants);
      });
      await expect(schedulingAccess(pool, actor, true, operation)).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
        status: 403,
      });
      expect(operation).not.toHaveBeenCalled();
    },
  );

  it("rejects a session that expires while the write lock is contended", async () => {
    vi.mocked(lockMemberEligibility).mockImplementation(async () => {
      query.mockResolvedValue({ rowCount: 0, rows: [] });
    });
    await expect(schedulingAccess(pool, actor, true, operation)).rejects.toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
      status: 401,
    });
    expect(operation).not.toHaveBeenCalled();
  });

  it("rejects an invalid session before grants or eligibility locks", async () => {
    query.mockResolvedValue({ rowCount: 0, rows: [] });
    await expect(schedulingAccess(pool, actor, true, operation)).rejects.toMatchObject({
      status: 401,
    });
    expect(readUserPermissions).not.toHaveBeenCalled();
    expect(lockMemberEligibility).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  });
});

describe("specific absence review authorization", () => {
  it.each([
    { grants: [], allowed: false },
    { grants: ["scheduling:read"], allowed: false },
    { grants: ["scheduling:read", "scheduling:write"], allowed: false },
    { grants: ["scheduling:review_absences"], allowed: false },
    { grants: ["scheduling:read", "scheduling:review_absences"], allowed: true },
  ])(
    "authorizes review reads without the eligibility lock: $grants",
    async ({ grants, allowed }) => {
      vi.mocked(readUserPermissions).mockResolvedValue(grants);
      const result = schedulingAccess(pool, actor, "review_absences", operation, {
        lockEligibility: false,
      });
      if (allowed) {
        await expect(result).resolves.toBe("authorized result");
        expect(operation).toHaveBeenCalledWith(client);
        expect(readUserPermissions).toHaveBeenCalledTimes(2);
      } else {
        await expect(result).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
        expect(operation).not.toHaveBeenCalled();
      }
      expect(lockMemberEligibility).not.toHaveBeenCalled();
    },
  );

  it.each([
    { grants: [], allowed: false },
    { grants: ["scheduling:read"], allowed: false },
    { grants: ["scheduling:write"], allowed: false },
    { grants: ["scheduling:read", "scheduling:write"], allowed: false },
    { grants: ["scheduling:review_absences"], allowed: false },
    { grants: ["scheduling:read", "scheduling:review_absences"], allowed: true },
  ])("uses current review grants $grants", async ({ grants, allowed }) => {
    vi.mocked(readUserPermissions).mockResolvedValue(grants);
    const result = schedulingAccess(pool, actor, "review_absences", operation);
    if (allowed) {
      await expect(result).resolves.toBe("authorized result");
      expect(lockMemberEligibility).toHaveBeenCalledOnce();
      expect(readUserPermissions).toHaveBeenCalledTimes(2);
    } else {
      await expect(result).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
      expect(lockMemberEligibility).not.toHaveBeenCalled();
      expect(operation).not.toHaveBeenCalled();
    }
  });
  it.each([
    { grants: ["scheduling:read"] },
    { grants: ["scheduling:review_absences"] },
    { grants: ["scheduling:read", "scheduling:write"] },
  ])("rechecks review grants after the lock: $grants", async ({ grants }) => {
    vi.mocked(readUserPermissions).mockResolvedValue([
      "scheduling:read",
      "scheduling:review_absences",
    ]);
    vi.mocked(lockMemberEligibility).mockImplementation(async () => {
      vi.mocked(readUserPermissions).mockResolvedValue(grants);
    });
    await expect(schedulingAccess(pool, actor, "review_absences", operation)).rejects.toMatchObject(
      { code: "PERMISSION_DENIED", status: 403 },
    );
    expect(operation).not.toHaveBeenCalled();
  });
  it("does not let a review grant authorize other writes", async () => {
    vi.mocked(readUserPermissions).mockResolvedValue([
      "scheduling:read",
      "scheduling:review_absences",
    ]);
    await expect(schedulingAccess(pool, actor, true, operation)).rejects.toMatchObject({
      status: 403,
    });
    expect(operation).not.toHaveBeenCalled();
  });
});
