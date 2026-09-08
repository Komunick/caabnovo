export type FileState =
  "initiated" | "uploaded" | "scanning" | "available" | "rejected" | "scan_error" | "deleted";
export type FileEvent = "uploaded" | "scan" | "promote" | "reject" | "scan_error" | "delete";
export type ScanFailure =
  "scanner_unavailable" | "infected" | "mime_mismatch" | "size_exceeded" | "checksum_mismatch";

const transitions: Record<FileState, Partial<Record<FileEvent, FileState>>> = {
  initiated: { uploaded: "uploaded" },
  uploaded: { scan: "scanning" },
  scanning: { promote: "available", reject: "rejected", scan_error: "scan_error" },
  available: { delete: "deleted" },
  rejected: { delete: "deleted" },
  scan_error: { scan: "scanning", delete: "deleted" },
  deleted: {},
};

export function nextFileState(state: FileState, event: FileEvent): FileState {
  const next = transitions[state][event];
  if (!next) throw new Error(`Invalid file transition: ${state} -> ${event}`);
  return next;
}

export function scanFailureState(
  failure: ScanFailure,
): Extract<FileState, "rejected" | "scan_error"> {
  return failure === "scanner_unavailable" ? "scan_error" : "rejected";
}
