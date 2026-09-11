import { uploadIntentSchema, type MemberFile } from "@caab/contracts";
import { memberRequest, mutationHeaders } from "./client";
export type PreparedPhoto = {
  file: File;
  id: string;
  checksum: string;
  url: string;
  headers: Record<string, string>;
  uploaded: boolean;
  finalized: boolean;
};
export async function uploadMemberPhoto(
  file: File,
  memberId: string,
  prepared: { current: PreparedPhoto | null },
  uploadKey: { current: string },
  signal: AbortSignal,
  onNotice: (notice: string) => void,
): Promise<string> {
  if (!prepared.current || prepared.current.file !== file) {
    onNotice("Preparando a foto…");
    const checksum = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
    const intent = uploadIntentSchema.parse(
      await memberRequest("/api/v1/files/upload-intents", {
        method: "POST",
        signal: signal,
        headers: mutationHeaders(uploadKey.current),
        body: JSON.stringify({
          originalName: file.name,
          declaredMime: file.type,
          sizeBytes: file.size,
          checksumSha256: checksum,
          ownerType: "member",
          ownerId: memberId,
        }),
      }),
    );
    prepared.current = {
      file,
      id: intent.fileId,
      checksum,
      url: intent.uploadUrl,
      headers: intent.requiredHeaders,
      uploaded: false,
      finalized: false,
    };
  }
  const current = prepared.current;
  if (!current.uploaded) {
    onNotice("Enviando a foto…");
    const sent = await fetch(current.url, {
      method: "PUT",
      signal: signal,
      headers: current.headers,
      body: file,
    });
    if (!sent.ok) {
      prepared.current = null;
      uploadKey.current = crypto.randomUUID();
      throw new Error("Não foi possível enviar a foto. Tente novamente.");
    }
    current.uploaded = true;
  }
  if (!current.finalized) {
    await memberRequest(`/api/v1/files/${current.id}/finalize`, {
      method: "POST",
      signal: signal,
      headers: mutationHeaders(crypto.randomUUID()),
      body: JSON.stringify({ checksumSha256: current.checksum }),
    });
    current.finalized = true;
  }
  onNotice("Verificando a segurança da foto…");
  for (;;) {
    signal.throwIfAborted();
    const status = await memberRequest<MemberFile>(
      `/api/v1/members/${memberId}/files/${current.id}/status`,
      { signal: signal },
    );
    if (status.status === "available" && status.scanStatus === "clean") break;
    if (status.status === "rejected")
      throw new Error("Esta foto não passou pela verificação. Escolha outra imagem.");
    if (status.status === "scan_error")
      throw new Error("A verificação está indisponível. Aguarde e tente salvar novamente.");
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
  }
  return current.id;
}
