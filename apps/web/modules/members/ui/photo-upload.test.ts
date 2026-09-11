import { afterEach, expect, test, vi } from "vitest";
import { uploadMemberPhoto, type PreparedPhoto } from "./photo-upload";
import { memberRequest } from "./client";

vi.mock("./client", () => ({
  memberRequest: vi.fn(),
  mutationHeaders: (key: string) => ({ "idempotency-key": key }),
}));
const request = vi.mocked(memberRequest);
const fileId = "00000000-0000-4000-8000-000000000002";
const memberId = "00000000-0000-4000-8000-000000000001";
const intent = {
  fileId,
  uploadUrl: "http://storage.test/upload",
  requiredHeaders: {},
  expiresAt: "2026-09-11T23:00:00.000Z",
};
function fixture() {
  const file = new File(["synthetic"], "photo.png", { type: "image/png" });
  const prepared: { current: PreparedPhoto | null } = { current: null };
  const key = { current: crypto.randomUUID() };
  const abort = new AbortController();
  const run = () => uploadMemberPhoto(file, memberId, prepared, key, abort.signal, vi.fn());
  return { prepared, key, abort, run };
}
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

test("photo waits for private scan and resumes a finalized upload without sending it twice", async () => {
  const put = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", put);
  const f = fixture();
  request
    .mockResolvedValueOnce(intent)
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({ status: "scan_error" });
  await expect(f.run()).rejects.toThrow("verificação está indisponível");
  request.mockResolvedValueOnce({ status: "available", scanStatus: "clean" });
  await expect(f.run()).resolves.toBe(fileId);
  expect(put).toHaveBeenCalledTimes(1);
  expect(request.mock.calls.filter(([url]) => url.endsWith("finalize"))).toHaveLength(1);
  expect(request.mock.calls.at(-1)?.[0]).toBe(`/api/v1/members/${memberId}/files/${fileId}/status`);
});

test("expired PUT clears the intent so retry requests a fresh URL", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  const f = fixture();
  const oldKey = f.key.current;
  request.mockResolvedValueOnce(intent);
  await expect(f.run()).rejects.toThrow("enviar a foto");
  expect(f.prepared.current).toBeNull();
  expect(f.key.current).not.toBe(oldKey);
  expect(request).toHaveBeenCalledTimes(1);
});

test("rejected images never return a linkable photo ID", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  request
    .mockResolvedValueOnce(intent)
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({ status: "rejected", scanStatus: "infected" });
  await expect(fixture().run()).rejects.toThrow("não passou pela verificação");
});
