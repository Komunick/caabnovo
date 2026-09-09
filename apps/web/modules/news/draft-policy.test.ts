import { describe, expect, it } from "vitest";
import { emptyNewsBody } from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import { prepareNewsDraft, prepareNewsDraftUpdate } from "./draft-policy";

const actor: RequestActor = {
  userId: crypto.randomUUID(),
  sessionId: crypto.randomUUID(),
  permissions: new Set(),
  mfaVerified: false,
};

describe("news draft policy", () => {
  it("uses the trusted panel actor without adding a news permission or approval", () => {
    expect(prepareNewsDraft(actor, { metadata: { title: "  Notícia  " } })).toMatchObject({
      editorUserId: actor.userId,
      metadata: { title: "Notícia" },
    });
  });

  it("requires an actor even when a valid command is supplied", () => {
    expect(() => prepareNewsDraft(undefined, { metadata: {} })).toThrowError(
      expect.objectContaining({ status: 401 }),
    );
    expect(() =>
      prepareNewsDraftUpdate(undefined, { metadata: {}, expectedVersion: 1 }, 1),
    ).toThrowError(expect.objectContaining({ status: 401 }));
  });

  it("rejects a forged author and a publish command through draft editing", () => {
    expect(() =>
      prepareNewsDraft(actor, { metadata: {}, editorUserId: crypto.randomUUID() }),
    ).toThrow();
    expect(() =>
      prepareNewsDraftUpdate(actor, { metadata: {}, expectedVersion: 2, published: true }, 2),
    ).toThrow();
  });

  it("rejects stale edits and prepares a version-bound update", () => {
    expect(() =>
      prepareNewsDraftUpdate(
        actor,
        { metadata: { title: "Obsoleta" }, body: emptyNewsBody, expectedVersion: 1 },
        2,
      ),
    ).toThrowError(expect.objectContaining({ status: 409, code: "NEWS_VERSION_CONFLICT" }));
    expect(
      prepareNewsDraftUpdate(
        actor,
        { metadata: { title: "Atual" }, body: emptyNewsBody, expectedVersion: 2 },
        2,
      ),
    ).toMatchObject({
      editorUserId: actor.userId,
      expectedVersion: 2,
      metadata: { title: "Atual" },
    });
  });
});
