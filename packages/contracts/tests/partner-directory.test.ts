import { describe, expect, it } from "vitest";
import {
  categoryCommandSchema,
  partnerAppSettingsSchema,
  partnerUnitListSchema,
  partnerReviewListSchema,
  moderatePartnerReviewSchema,
} from "../src/partner-directory";

describe("partner directory contracts", () => {
  it("requires a version when editing and rejects invalid category commands", () => {
    const input = { name: " Saúde ", justification: "Organização sintética" };
    expect(categoryCommandSchema.parse(input).name).toBe("Saúde");
    for (const extra of [
      { id: crypto.randomUUID() },
      { name: " " },
      { justification: "" },
      { role: "admin" },
    ])
      expect(categoryCommandSchema.safeParse({ ...input, ...extra }).success).toBe(false);
  });
  it("distinguishes all categories from an explicit empty selection and rejects duplicates", () => {
    const input = {
      expectedVersion: 1,
      mode: "selected",
      categoryIds: [],
      justification: "Seleção sintética",
    };
    expect(partnerAppSettingsSchema.parse(input).categoryIds).toEqual([]);
    expect(partnerAppSettingsSchema.parse({ ...input, mode: "all" }).mode).toBe("all");
    const id = crypto.randomUUID();
    for (const extra of [
      { categoryIds: [id, id] },
      { categoryIds: ["invalid"] },
      { expectedVersion: 0 },
      { mode: "unknown" },
    ])
      expect(partnerAppSettingsSchema.safeParse({ ...input, ...extra }).success).toBe(false);
  });
  it("bounds pagination and moderation without allowing original content edits", () => {
    expect(partnerUnitListSchema.parse({ q: " Salvador ", page: "2" })).toMatchObject({
      q: "Salvador",
      page: 2,
    });
    expect(partnerReviewListSchema.safeParse({ page: 0 }).success).toBe(false);
    const input = { expectedVersion: 1, status: "hidden", justification: "Revisão sintética" };
    expect(moderatePartnerReviewSchema.safeParse(input).success).toBe(true);
    for (const extra of [
      { rating: 5 },
      { comment: "Alterado" },
      { authorLabel: "Outro" },
      { status: "pending" },
      { justification: "" },
    ])
      expect(moderatePartnerReviewSchema.safeParse({ ...input, ...extra }).success).toBe(false);
  });
});
