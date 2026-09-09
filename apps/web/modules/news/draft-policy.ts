import "server-only";
import { createNewsDraftRequestSchema, updateNewsDraftRequestSchema } from "@caab/contracts";
import { AuthenticationRequiredError } from "../auth/authorize";
import type { RequestActor } from "../shared/request-context";
import { NewsPolicyError } from "./errors";

// The caller must resolve this actor from the active panel session, never from request data.
export function prepareNewsDraft(actor: RequestActor | undefined, input: unknown) {
  if (!actor) throw new AuthenticationRequiredError("Authentication required");
  const request = createNewsDraftRequestSchema.parse(input);
  return { ...request, editorUserId: actor.userId };
}

export function prepareNewsDraftUpdate(
  actor: RequestActor | undefined,
  input: unknown,
  currentVersion: number,
) {
  if (!actor) throw new AuthenticationRequiredError("Authentication required");
  const request = updateNewsDraftRequestSchema.parse(input);
  if (request.expectedVersion !== currentVersion) {
    throw new NewsPolicyError(
      "NEWS_VERSION_CONFLICT",
      409,
      "Esta notícia foi alterada. Recarregue a versão atual antes de salvar.",
    );
  }
  // Persistence must also compare expectedVersion atomically; this preflight is not a lock.
  return { ...request, editorUserId: actor.userId };
}
