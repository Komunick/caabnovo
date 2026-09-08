import { describe, expect, it } from "vitest";
import { nextFileState, scanFailureState } from "../src/file-state";

describe("stored-file state machine", () => {
  it("accepts the quarantine, scanning, promotion and deletion lifecycle", () => {
    expect(nextFileState("initiated", "uploaded")).toBe("uploaded");
    expect(nextFileState("uploaded", "scan")).toBe("scanning");
    expect(nextFileState("scanning", "promote")).toBe("available");
    expect(nextFileState("scan_error", "scan")).toBe("scanning");
    expect(nextFileState("available", "delete")).toBe("deleted");
    expect(nextFileState("rejected", "delete")).toBe("deleted");
  });

  it("fails closed and rejects impossible transitions", () => {
    expect(scanFailureState("scanner_unavailable")).toBe("scan_error");
    expect(scanFailureState("infected")).toBe("rejected");
    expect(scanFailureState("mime_mismatch")).toBe("rejected");
    expect(scanFailureState("size_exceeded")).toBe("rejected");
    expect(scanFailureState("checksum_mismatch")).toBe("rejected");
    expect(() => nextFileState("scanning", "uploaded")).toThrow("Invalid file transition");
    expect(() => nextFileState("scan_error", "promote")).toThrow("Invalid file transition");
  });
});
