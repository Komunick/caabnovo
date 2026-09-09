import { describe, expect, it } from "vitest";
import { newsDraftMetadataSchema } from "@caab/contracts";
import { validateNewsPublication, type NewsPublicationSnapshot } from "./publication-policy";

const actor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set<string>(),
  mfaVerified: false,
};
const newsId = crypto.randomUUID();
const fileId = crypto.randomUUID();
const command = { expectedVersion: 3, channels: ["site", "app"] };
function snapshot(): NewsPublicationSnapshot {
  return {
    id: newsId,
    version: 3,
    archived: false,
    metadata: newsDraftMetadataSchema.parse({
      title: "Atendimento CAAB",
      slug: "atendimento-caab",
      cover: { fileId, alt: "Equipe no atendimento" },
    }),
    content: { status: "valid", fileIds: [] },
    files: [{ id: fileId, ownerNewsId: newsId, status: "available", mime: "image/jpeg" }],
  };
}

describe("news publication policy", () => {
  it("allows direct publication preparation with panel access and no extra permission", () => {
    const current = snapshot();
    const before = structuredClone(current);
    expect(validateNewsPublication(actor, command, current)).toEqual({
      expectedVersion: 3,
      channels: ["site", "app"],
      editorUserId: actor.userId,
    });
    expect(current).toEqual(before);
  });

  it("denies anonymous access before inspecting the requested publication", () => {
    expect(() => validateNewsPublication(undefined, {}, snapshot())).toThrowError(
      expect.objectContaining({ status: 401 }),
    );
  });

  it("rejects a stale or archived revision", () => {
    expect(() =>
      validateNewsPublication(actor, { ...command, expectedVersion: 2 }, snapshot()),
    ).toThrowError(expect.objectContaining({ status: 409, code: "NEWS_VERSION_CONFLICT" }));
    expect(() =>
      validateNewsPublication(actor, command, { ...snapshot(), archived: true }),
    ).toThrowError(expect.objectContaining({ status: 409, code: "NEWS_ARCHIVED" }));
  });

  it("reports missing editorial fields together instead of publishing an incomplete draft", () => {
    const current = snapshot();
    current.metadata.title = " ";
    current.metadata.slug = "";
    current.metadata.cover!.alt = " ";
    current.content.status = "empty";
    expect(() => validateNewsPublication(actor, command, current)).toThrowError(
      expect.objectContaining({
        code: "NEWS_NOT_READY",
        status: 422,
        issues: expect.arrayContaining([
          { field: "title", code: "TITLE_REQUIRED" },
          { field: "slug", code: "SLUG_REQUIRED" },
          { field: "cover.alt", code: "COVER_ALT_REQUIRED" },
          { field: "content", code: "CONTENT_REQUIRED" },
        ]),
      }),
    );
  });

  it("rejects content that has not passed server-side validation", () => {
    const current = snapshot();
    current.content.status = "invalid";
    expect(() => validateNewsPublication(actor, command, current)).toThrowError(
      expect.objectContaining({
        issues: expect.arrayContaining([{ field: "content", code: "CONTENT_INVALID" }]),
      }),
    );
  });

  it.each(["pending", "rejected", "deleted"])("rejects a %s cover", (status) => {
    const current = snapshot();
    current.files[0]!.status = status;
    expect(() => validateNewsPublication(actor, command, current)).toThrowError(
      expect.objectContaining({ code: "NEWS_NOT_READY" }),
    );
  });

  it("rejects a missing file, a file belonging to another news item and a non-image cover", () => {
    for (const files of [
      [],
      [{ ...snapshot().files[0]!, ownerNewsId: crypto.randomUUID() }],
      [{ ...snapshot().files[0]!, mime: "text/html" }],
      [{ ...snapshot().files[0]!, mime: "image/svg+xml" }],
    ]) {
      expect(() => validateNewsPublication(actor, command, { ...snapshot(), files })).toThrowError(
        expect.objectContaining({ code: "NEWS_NOT_READY" }),
      );
    }
  });

  it("checks all body media, including those that are not the cover", () => {
    const current = snapshot();
    current.content.fileIds = [crypto.randomUUID()];
    expect(() => validateNewsPublication(actor, command, current)).toThrowError(
      expect.objectContaining({
        issues: expect.arrayContaining([{ field: "content.files", code: "FILE_UNAVAILABLE" }]),
      }),
    );
  });

  it("does not accept client-supplied scan status or body validation", () => {
    expect(() =>
      validateNewsPublication(
        actor,
        { ...command, content: { status: "valid" }, files: snapshot().files },
        snapshot(),
      ),
    ).toThrow();
  });
});
