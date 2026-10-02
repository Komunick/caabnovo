import { describe, expect, it } from "vitest";
import {
  schedulingAbsenceAppealSchema,
  schedulingAbsenceDecisionSchema,
  schedulingAbsenceRecordSchema,
  schedulingAbsenceQuerySchema,
  schedulingAbsenceStatusLabels,
} from "./scheduling-absence";

const fileId = "ef550024-62cc-4d76-8a43-8c558f004fb9";
const appeal = {
  expectedVersion: 1,
  kind: "justification",
  explanation: "  Comprovante do impedimento.  ",
  evidenceFileIds: [fileId],
};

describe("absence command contracts", () => {
  it.each(["justification", "contestation"])("requires text and proof for %s", (kind) => {
    expect(schedulingAbsenceAppealSchema.parse({ ...appeal, kind })).toEqual({
      ...appeal,
      kind,
      explanation: "Comprovante do impedimento.",
    });
    for (const change of [
      { explanation: " \n\t " },
      { explanation: undefined },
      { evidenceFileIds: [] },
      { evidenceFileIds: undefined },
      { evidenceFileIds: ["https://unverified.test/proof"] },
      { expectedVersion: 0 },
      { expectedVersion: undefined },
    ]) {
      expect(schedulingAbsenceAppealSchema.safeParse({ ...appeal, kind, ...change }).success).toBe(
        false,
      );
    }
  });

  it("rejects forged timing, identity and decision fields on an appeal", () => {
    for (const change of [
      { memberId: fileId },
      { submittedBy: fileId },
      { submittedAt: "2026-10-01T12:00:00Z" },
      { outcome: "accepted" },
    ]) {
      expect(schedulingAbsenceAppealSchema.safeParse({ ...appeal, ...change }).success).toBe(false);
    }
  });

  it("accepts only explicit decisions against the current occurrence version", () => {
    for (const outcome of ["accepted", "rejected"]) {
      expect(schedulingAbsenceDecisionSchema.parse({ expectedVersion: 2, outcome })).toEqual({
        expectedVersion: 2,
        outcome,
      });
    }
    expect(schedulingAbsenceDecisionSchema.safeParse({ outcome: "accepted" }).success).toBe(false);
    expect(
      schedulingAbsenceDecisionSchema.safeParse({ expectedVersion: 2, outcome: "pending" }).success,
    ).toBe(false);
    expect(
      schedulingAbsenceDecisionSchema.safeParse({
        expectedVersion: 2,
        outcome: "accepted",
        decidedBy: fileId,
      }).success,
    ).toBe(false);
  });

  it("does not accept caller-selected registration time, beneficiary or duration", () => {
    expect(schedulingAbsenceRecordSchema.parse({ expectedVersion: 1 })).toEqual({
      expectedVersion: 1,
    });
    for (const change of [
      { recordedAt: "2026-10-01T12:00:00Z" },
      { memberId: fileId },
      { durationDays: 60 },
      { expectedVersion: 0 },
    ]) {
      expect(
        schedulingAbsenceRecordSchema.safeParse({ expectedVersion: 1, ...change }).success,
      ).toBe(false);
    }
  });
});

describe("safe absence query contract", () => {
  it("defaults to a bounded first page and all process statuses", () => {
    expect(schedulingAbsenceQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 25,
      q: "",
      status: "all",
    });
  });
  it("supports detail lookup, individual filtering and trimmed name search", () => {
    expect(
      schedulingAbsenceQuerySchema.parse({
        bookingId: fileId,
        memberId: fileId,
        q: " Pessoa ",
        status: "under_review",
        page: "2",
        pageSize: "1",
      }),
    ).toEqual({
      bookingId: fileId,
      memberId: fileId,
      q: "Pessoa",
      status: "under_review",
      page: 2,
      pageSize: 1,
    });
    expect(schedulingAbsenceStatusLabels.accepted).toBe("Falta abonada");
  });
  it.each([
    { page: 0 },
    { page: 1.5 },
    { page: 100001 },
    { pageSize: 101 },
    { pageSize: 0 },
    { bookingId: "bad" },
    { memberId: "bad" },
    { q: "a".repeat(101) },
    { status: "expired" },
    { explanation: "private" },
    { includeEvidence: true },
  ])("rejects invalid or unsupported query %j", (query) => {
    expect(schedulingAbsenceQuerySchema.safeParse(query).success).toBe(false);
  });
});
