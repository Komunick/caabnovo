import { describe, expect, it } from "vitest";
import { accessPermissionSchema, userAccessChangeSchema } from "./user-access";

describe("absence review permission", () => {
  it("registers review independently of scheduling writes", () => {
    expect(accessPermissionSchema.parse("scheduling:review_absences")).toBe(
      "scheduling:review_absences",
    );
    expect(
      userAccessChangeSchema.safeParse({
        permissions: ["scheduling:read", "scheduling:review_absences"],
        expectedPermissions: [],
        version: 0,
      }).success,
    ).toBe(true);
  });
  it("requires read access for review", () => {
    expect(
      userAccessChangeSchema.safeParse({
        permissions: ["scheduling:review_absences"],
        expectedPermissions: [],
        version: 0,
      }).success,
    ).toBe(false);
  });
});
