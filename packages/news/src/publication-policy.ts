import {
  newsDraftMetadataSchema,
  publishNewsRequestSchema,
  uploadMimeSchema,
  type NewsDraftMetadata,
} from "@caab/contracts";
import { NewsPolicyError } from "./errors";

/** Loaded by the server from the revision, content validator and existing file service. */
export interface NewsPublicationSnapshot {
  id: string;
  version: number;
  archived: boolean;
  metadata: NewsDraftMetadata;
  content: { status: "valid" | "empty" | "invalid"; fileIds: readonly string[] };
  files: {
    id: string;
    ownerNewsId: string | null;
    status: string;
    mime: string | null;
  }[];
}

/** Checks prerequisites only. The service must recheck within its mutation transaction. */
export function validateNewsPublication(
  actor: { userId: string } | undefined,
  input: unknown,
  snapshot: NewsPublicationSnapshot,
) {
  if (!actor) throw Object.assign(new Error("Authentication required"), { status: 401 });
  const request = publishNewsRequestSchema.parse(input);
  if (request.expectedVersion !== snapshot.version) {
    throw new NewsPolicyError(
      "NEWS_VERSION_CONFLICT",
      409,
      "Esta notícia foi alterada. Confira a versão atual antes de publicar.",
    );
  }
  if (snapshot.archived) {
    throw new NewsPolicyError(
      "NEWS_ARCHIVED",
      409,
      "Uma notícia arquivada não pode ser publicada.",
    );
  }

  const metadata = newsDraftMetadataSchema.parse(snapshot.metadata);
  const issues: { field: string; code: string }[] = [];
  if (!metadata.title) issues.push({ field: "title", code: "TITLE_REQUIRED" });
  if (!metadata.slug) issues.push({ field: "slug", code: "SLUG_REQUIRED" });
  if (metadata.cover && !metadata.cover.alt) {
    issues.push({ field: "cover.alt", code: "COVER_ALT_REQUIRED" });
  }
  if (snapshot.content.status !== "valid") {
    issues.push({
      field: "content",
      code: snapshot.content.status === "empty" ? "CONTENT_REQUIRED" : "CONTENT_INVALID",
    });
  }

  const referencedFiles = new Set(snapshot.content.fileIds);
  if (metadata.cover) referencedFiles.add(metadata.cover.fileId);
  const filesById = new Map(snapshot.files.map((file) => [file.id, file]));
  for (const fileId of referencedFiles) {
    const file = filesById.get(fileId);
    const field = metadata.cover?.fileId === fileId ? "cover.fileId" : "content.files";
    if (
      !file ||
      file.ownerNewsId !== snapshot.id ||
      file.status !== "available" ||
      !uploadMimeSchema.safeParse(file.mime).success
    ) {
      issues.push({ field, code: "FILE_UNAVAILABLE" });
    } else if (metadata.cover?.fileId === fileId && !file.mime?.startsWith("image/")) {
      issues.push({ field, code: "COVER_IMAGE_REQUIRED" });
    }
  }

  if (issues.length > 0) {
    throw new NewsPolicyError(
      "NEWS_NOT_READY",
      422,
      "Complete os campos e confira as mídias antes de publicar.",
      issues,
    );
  }
  return { ...request, editorUserId: actor.userId };
}
